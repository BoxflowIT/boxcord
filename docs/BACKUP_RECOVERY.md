# Backup & Disaster Recovery Strategy

## Database Backup Strategy

### Automated Daily Backups

#### Production Environment
```bash
# Automated backup script (run via cron daily at 2 AM)
#!/bin/bash

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"
DB_NAME="boxcord_production"
S3_BUCKET="s3://boxcord-backups"

# Create backup
pg_dump -U postgres -d $DB_NAME -F c -f "$BACKUP_DIR/boxcord_$DATE.dump"

# Compress backup
gzip "$BACKUP_DIR/boxcord_$DATE.dump"

# Upload to S3
aws s3 cp "$BACKUP_DIR/boxcord_$DATE.dump.gz" "$S3_BUCKET/daily/"

# Keep only last 7 days of local backups
find $BACKUP_DIR -name "*.dump.gz" -mtime +7 -delete

# Log backup
echo "$(date): Backup completed - boxcord_$DATE.dump.gz" >> /var/log/boxcord-backup.log
```

#### Cron Schedule
```crontab
# Daily backup at 2 AM
0 2 * * * /opt/boxcord/scripts/backup-db.sh

# Weekly full backup at Sunday 3 AM
0 3 * * 0 /opt/boxcord/scripts/backup-db-full.sh

# Monthly backup retention at 1st of month 4 AM
0 4 1 * * /opt/boxcord/scripts/backup-retention.sh
```

### Backup Retention Policy

- **Daily Backups**: Keep for 7 days
- **Weekly Backups**: Keep for 4 weeks
- **Monthly Backups**: Keep for 12 months
- **Yearly Backups**: Keep for 3 years

### S3 Bucket Configuration
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

### Standard Restore (Full Database)

```bash
#!/bin/bash
# restore-db.sh - Restore from backup

# 1. Stop the application
sudo systemctl stop boxcord

# 2. Download backup from S3
BACKUP_FILE="boxcord_20260221_020000.dump.gz"
aws s3 cp "s3://boxcord-backups/daily/$BACKUP_FILE" /tmp/

# 3. Decompress backup
gunzip "/tmp/$BACKUP_FILE"

# 4. Drop existing database (DANGEROUS - confirm first!)
psql -U postgres -c "DROP DATABASE IF EXISTS boxcord_production;"

# 5. Create fresh database
psql -U postgres -c "CREATE DATABASE boxcord_production;"

# 6. Restore backup
pg_restore -U postgres -d boxcord_production "/tmp/${BACKUP_FILE%.gz}"

# 7. Verify restore
psql -U postgres -d boxcord_production -c "SELECT COUNT(*) FROM users;"

# 8. Start application
sudo systemctl start boxcord

# 9. Verify application
curl http://localhost:3001/health

echo "Database restore completed!"
```

### Point-in-Time Recovery (PITR)

For PostgreSQL with WAL archiving enabled:

```bash
# 1. Stop PostgreSQL
sudo systemctl stop postgresql

# 2. Restore base backup
cd /var/lib/postgresql/14/main
rm -rf *
tar -xzf /backups/postgresql/base-backup.tar.gz

# 3. Create recovery.conf
cat > recovery.conf << EOF
restore_command = 'cp /backups/postgresql/wal_archive/%f %p'
recovery_target_time = '2026-02-21 14:30:00'
EOF

# 4. Start PostgreSQL - it will recover to the target time
sudo systemctl start postgresql
```

### Partial Restore (Single Table)

```bash
# Restore just one table
pg_restore -U postgres -d boxcord_production -t messages backup.dump
```

## Disaster Recovery Scenarios

### Scenario 1: Data Corruption
**Symptoms**: Application errors, data inconsistencies
**Recovery Time**: 15-30 minutes

1. Identify corruption scope
2. Stop application
3. Restore last known good backup
4. Verify data integrity
5. Restart application

### Scenario 2: Complete Database Loss
**Symptoms**: Database server failure, disk failure
**Recovery Time**: 1-2 hours

1. Provision new database server
2. Install PostgreSQL
3. Restore latest backup
4. Apply WAL logs if available
5. Update connection strings
6. Test thoroughly before switching

### Scenario 3: Application Server Failure
**Symptoms**: Server unreachable, OS crash
**Recovery Time**: 30-60 minutes

1. Provision new server
2. Deploy application from git
3. Install dependencies
4. Configure environment variables
5. Start services
6. Verify connectivity

## Testing Backup & Restore

### Monthly Restore Test
```bash
#!/bin/bash
# test-restore.sh - Test backup validity monthly

# Create test database
psql -U postgres -c "CREATE DATABASE boxcord_restore_test;"

# Restore latest backup
LATEST_BACKUP=$(aws s3 ls s3://boxcord-backups/daily/ | sort | tail -n 1 | awk '{print $4}')
aws s3 cp "s3://boxcord-backups/daily/$LATEST_BACKUP" /tmp/
gunzip "/tmp/$LATEST_BACKUP"
pg_restore -U postgres -d boxcord_restore_test "/tmp/${LATEST_BACKUP%.gz}"

# Run integrity checks
psql -U postgres -d boxcord_restore_test << EOF
SELECT 'Users' as table, COUNT(*) FROM users
UNION ALL
SELECT 'Messages', COUNT(*) FROM messages
UNION ALL
SELECT 'Workspaces', COUNT(*) FROM workspaces;
EOF

# Cleanup
psql -U postgres -c "DROP DATABASE boxcord_restore_test;"

echo "Backup test completed - $(date)" >> /var/log/backup-test.log
```

## Monitoring & Alerts

### Backup Monitoring
- Alert if backup fails
- Alert if backup size deviates >20% from average
- Alert if S3 upload fails
- Daily backup size report

### CloudWatch Alarms
```json
{
  "AlarmName": "BackupFailed",
  "MetricName": "BackupSuccess",
  "Threshold": 1,
  "ComparisonOperator": "LessThanThreshold",
  "EvaluationPeriods": 1,
  "AlarmActions": ["arn:aws:sns:region:account:ops-alerts"]
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
