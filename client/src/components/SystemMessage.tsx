import React, { useState, useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";

interface SystemMessageProps {
  type: "loading" | "info" | "error" | "success";
  message?: string;
  className?: string;
}

const getRandomLoadingMessage = () => {
  const loadingMessages = [
    "Asking the DNS for consent...",
    "Booting ancient meme protocols...",
    "Sacrificing a goat to the API gods...",
    "Reheating pizza rolls for optimal coding...",
    "Downloading more dedotated wam...",
    "Simulating dial-up noises... AEEEEIIIIOOOO...",
    "Mining Bitcoin with abacus...",
    "Defragmenting existential dread...",
    "Initializing panic sequence...",
    "Reciting GNU license in reverse...",
    "Feeding 1s and 0s to hungry bot...",
    "Consulting the Necronomicon for 404 fixes...",
    "Asking Jeeves about en passant...",
    "Reinstalling Adobe Reader... just in case...",
    "Trying to exit vim...",
    "Sharpening MLG montage skills...",
    "Blaming solar flares for downtime...",
    "Deleting System32 for faster speeds...",
    "Breeding Chrome dinosaur clones...",
    "Asking to speak to the manager of the internet...",
    "Debating the meaning of life with a toaster...",
    "Convincing Skynet I'm not a threat...",
    "Hiding from Clippy...",
    "Reticulating splines... or maybe just napping...",
    "Checking if the cake is a lie...",
    "Summoning Cthulhu for tech support...",
    "Trying to find the sauce...",
    "Is mayonnaise an instrument?",
    "One does not simply deploy on Friday...",
    "Adding insult to injury...",
    "Googling Google...",
    "Still loading...",
    "Patience, young Padawan...",
    "Waiting for Godot...",
  ];

  return loadingMessages[Math.floor(Math.random() * loadingMessages.length)];
};

export const SystemMessage: React.FC<SystemMessageProps> = ({
  type,
  message,
  className = "",
}) => {
  const { isLoading } = useChat();

  // Add state to hold the current loading message
  const [currentMessage, setCurrentMessage] = useState(
    type === "loading" && !message ? getRandomLoadingMessage() : message || ""
  );

  // Update the loading message every 5 seconds if no external message is provided
  useEffect(() => {
    if (type === "loading" && !message) {
      const interval = setInterval(() => {
        setCurrentMessage(getRandomLoadingMessage());
      }, 3000); // update every 5 seconds
      return () => clearInterval(interval);
    }
  }, [type, message]);

  if (type === "loading" && !isLoading) {
    return null;
  }

  let displayMessage = message || currentMessage;

  let iconClass = "";
  switch (type) {
    case "loading":
      iconClass = "animate-spin";
      break;
    case "info":
      iconClass = "text-blue-500";
      break;
    case "error":
      iconClass = "text-red-500";
      break;
    case "success":
      iconClass = "text-green-500";
      break;
  }

  return (
    <div
      className={`flex z-50 items-center justify-center py-2 px-4 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-sm ${className}`}
    >
      {type === "loading" && (
        <svg
          className={`mr-2 h-4 w-4 ${iconClass}`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {type === "info" && (
        <svg
          className={`mr-2 h-4 w-4 ${iconClass}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      {type === "error" && (
        <svg
          className={`mr-2 h-4 w-4 ${iconClass}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      {type === "success" && (
        <svg
          className={`mr-2 h-4 w-4 ${iconClass}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      )}
      <span className="font-medium">{displayMessage}</span>
    </div>
  );
};

export default SystemMessage;
