// Reusable Profile Info Display Component
import React from 'react';

interface ProfileInfoProps {
  firstName?: string;
  lastName?: string;
  bio?: string;
  email: string;
  memberSince?: string;
}

export function ProfileInfo({
  firstName,
  lastName,
  bio,
  email,
  memberSince
}: ProfileInfoProps) {
  return (
    <div className="space-y-4">
      {(firstName || lastName) && (
        <div>
          <label className="label-base">Namn</label>
          <p className="text-boxflow-light">
            {[firstName, lastName].filter(Boolean).join(' ')}
          </p>
        </div>
      )}

      <div>
        <label className="label-base">E-post</label>
        <p className="text-boxflow-light">{email}</p>
      </div>

      {bio && (
        <div>
          <label className="label-base">Bio</label>
          <p className="text-boxflow-light whitespace-pre-wrap">{bio}</p>
        </div>
      )}

      {memberSince && (
        <div>
          <label className="label-base">Medlem sedan</label>
          <p className="text-boxflow-muted text-sm">
            {new Date(memberSince).toLocaleDateString('sv-SE', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      )}
    </div>
  );
}
