# Backup & Disaster Recovery Strategy

## Database Backup Strategy

### AWS RDS Automated Backups (Primary)

RDS provides automated daily snapshots and point-in-time recovery out of the box.

**Current Configuration (via CloudFormation):**
- Automated snapshots: Daily, retained for 7 days
- Point-in-time recovery: Enabled (5-minute granularity)
- Multi-AZ: Available for production upgrades

```bash
# View automated snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier boxcord-production \
  --snapshot-type automated

# Create manual snapshot before major changes
aws rds create-db-snapshot \
  --db-instance-identifier boxcord-production \
  --db-snapshot-identifier boxcord-pre-migration-$(date +%Y%m%d)
```

### Additional S3 Backups (Optional)

For extra safety, export snapshots to S3:

```bash
# Export snapshot to S3
aws rds start-export-task \
  --export-task-identifier boxcord-export-$(date +%Y%m%d) \
  --source-arn arn:aws:rds:eu-north-1:650485669960:snapshot:boxcord-manual-backup \
  --s3-bucket-name boxcord-backups \
  --iam-role-arn arn:aws:iam::650485669960:role/boxcord-rds-export \
  --kms-key-id alias/aws/rds
```

### Backup Retention Policy

- **RDS Automated Snapshots**: 7 days (configurable up to 35)
- **Manual Snapshots**: Kept indefinitely until deleted
- **S3 Exports**: Managed via lifecycle rules

### S3 Bucket Lifecycle Configuration
```json
{
  "LifecycleConfiguration": {
    "Rules": [
      {
        "Id": "DailyBackupRetention",
        "Status": "Enabled",
        "Prefix": "daily/",
        "Expiration": {
          "Days": 7
        }
      },
      {
        "Id": "WeeklyBackupRetention",
        "Status": "Enabled",
        "Prefix": "weekly/",
        "Expiration": {
          "Days": 30
        }
      },
      {
        "Id": "MonthlyBackupRetention",
        "Status": "Enabled",
        "Prefix": "monthly/",
        "Expiration": {
          "Days": 365
        }
      }
    ]
  }
}
```

## Database Restore Procedures

### Restore from RDS Snapshot

```bash
# 1. List available snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier boxcord-production \
  --query 'DBSnapshots[*].[DBSnapshotIdentifier,SnapshotCreateTime]' \
  --output table

# 2. Restore snapshot to a new instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier boxcord-production-restored \
  --db-snapshot-identifier <SNAPSHOT_ID> \
  --db-instance-class db.t4g.micro \
  --vpc-security-group-ids <SG_ID>

# 3. Wait for instance to be available
aws rds wait db-instance-available \
  --db-instance-identifier boxcord-production-restored

# 4. Update ECS task definition with new DB endpoint
# 5. Verify data integrity
# 6. Switch DNS/config to restored instance
# 7. Delete old instance when confirmed
```

### Point-in-Time Recovery (PITR)

```bash
# Restore to a specific point in time
aws rds restore-db-instance-to-point-in-time \
  --source-db-instance-identifier boxcord-production \
  --target-db-instance-identifier boxcord-production-pitr \
  --restore-time "2026-03-09T14:30:00Z" \
  --db-instance-class db.t4g.micro

# Wait for instance
aws rds wait db-instance-available \
  --db-instance-identifier boxcord-production-pitr
```

### Partial Restore (Single Table)

For table-level restores, restore the snapshot to a temporary instance and export:

```bash
# 1. Restore snapshot to temp instance (see above)
# 2. Connect and extract needed data
pg_dump -h <RESTORED_HOST> -U boxcord -t messages boxcord > messages_backup.sql
# 3. Import to production
psql -h <PROD_HOST> -U boxcord boxcord < messages_backup.sql
# 4. Delete temp instance
aws rds delete-db-instance \
  --db-instance-identifier boxcord-production-restored \
  --skip-final-snapshot
```

## Disaster Recovery Scenarios

### Scenario 1: Data Corruption
**Symptoms**: Application errors, data inconsistencies
**Recovery Time**: 15-30 minutes

1. Identify corruption scope
2. Scale ECS service to 0 tasks (stop traffic)
3. Restore from last known good RDS snapshot
4. Scale ECS service back up
5. Verify data integrity

### Scenario 2: Complete Database Loss
**Symptoms**: Database server failure, disk failure
**Recovery Time**: 30-60 minutes (RDS handles most of this automatically)

1. RDS Multi-AZ failover happens automatically (if enabled)
2. For manual recovery: Restore from latest snapshot
3. Update ECS task definition if endpoint changed
4. Test thoroughly before switching

### Scenario 3: Application Server Failure
**Symptoms**: ECS tasks failing, health checks failing
**Recovery Time**: 5-15 minutes (ECS auto-recovery)

1. ECS automatically replaces unhealthy tasks
2. If persistent: Check CloudWatch logs (`/ecs/boxcord-production`)
3. Roll back to previous task definition if needed:
   ```bash
   aws ecs update-service \
     --cluster boxcord-production \
     --service boxcord-production \
     --task-definition boxcord-production:<PREVIOUS_VERSION> \
     --force-new-deployment
   ```

## Testing Backup & Restore

### Quarterly Restore Test
```bash
#!/bin/bash
# test-restore.sh - Test backup validity quarterly

# Get latest automated snapshot
LATEST=$(aws rds describe-db-snapshots \
  --db-instance-identifier boxcord-production \
  --snapshot-type automated \
  --query 'DBSnapshots[-1].DBSnapshotIdentifier' \
  --output text)

# Restore to test instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier boxcord-restore-test \
  --db-snapshot-identifier "$LATEST" \
  --db-instance-class db.t4g.micro

aws rds wait db-instance-available \
  --db-instance-identifier boxcord-restore-test

# Get endpoint
ENDPOINT=$(aws rds describe-db-instances \
  --db-instance-identifier boxcord-restore-test \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text)

# Run integrity checks
psql -h "$ENDPOINT" -U boxcord -d boxcord << EOF
SELECT 'Users' as table_name, COUNT(*) as row_count FROM "User"
UNION ALL
SELECT 'Messages', COUNT(*) FROM "Message"
UNION ALL
SELECT 'Workspaces', COUNT(*) FROM "Workspace";
EOF

# Cleanup
aws rds delete-db-instance \
  --db-instance-identifier boxcord-restore-test \
  --skip-final-snapshot

echo "Backup test completed - $(date)"
```

## Monitoring & Alerts

### Backup Monitoring
- RDS automated backups: Monitored via CloudWatch Events
- Alert if snapshot creation fails
- Alert if snapshot age exceeds 24 hours
- Track backup storage usage

### CloudWatch Alarms
```json
{
  "AlarmName": "RDSBackupFailed",
  "MetricName": "FreeStorageSpace",
  "Namespace": "AWS/RDS",
  "Threshold": 5368709120,
  "ComparisonOperator": "LessThanThreshold",
  "EvaluationPeriods": 1,
  "AlarmActions": ["arn:aws:sns:eu-north-1:650485669960:boxcord-ops-alerts"]
}
```

## Contact Information

### Emergency Contacts
- **DevOps Lead**: ops@boxflow.com
- **Database Admin**: dba@boxflow.com
- **On-Call**: +46 XXX XXX XXX

### Escalation Path
1. On-call engineer (0-15 min)
2. DevOps lead (15-30 min)
3. CTO (30-60 min)
