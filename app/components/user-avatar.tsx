"use client";

import { useState } from "react";

interface UserAvatarProps {
  imageUrl?: string | null;
  userName?: string | null;
}

export default function UserAvatar({ imageUrl, userName }: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Get the first initial from the user's name
  const getInitial = () => {
    if (!userName) return "U";
    return userName.charAt(0).toUpperCase();
  };

  // If no image URL or image failed to load, show fallback
  if (!imageUrl || imageError) {
    return (
      <div
        className="flex h-9 w-9 items-center justify-center rounded-full ring-2 text-sm font-semibold"
        style={{
          borderColor: "var(--theme-border)",
          backgroundColor: "var(--theme-bg-card-alt)",
          color: "var(--theme-primary)",
        }}
      >
        {getInitial()}
      </div>
    );
  }

  // Show the image with error handling
  return (
    <img
      src={imageUrl}
      alt={userName || "User"}
      className="h-9 w-9 rounded-full ring-2"
      style={{ borderColor: "var(--theme-border)" }}
      onError={() => setImageError(true)}
    />
  );
}
