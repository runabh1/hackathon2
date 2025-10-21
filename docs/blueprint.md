# **App Name**: MentorAI

## Core Features:

- Study Guide Generation: Generates context-aware exam preparation answers using RAG, based on retrieved study materials. Implemented using Genkit Flow (`StudyGuideFlow`) as a tool.
- Email Summarization Tool: Summarizes unread emails, accessible by the AI Agent via a Genkit Tool (`EmailManagerTool`).
- Attendance Update Tool: Updates the student's attendance record in Firestore.  Implemented as a Genkit Tool (`AttendanceTool`).
- User Authentication: Secure user login/signup using Firebase Authentication.
- Chat Interface: A modern, simple chat interface (similar to a messaging app) for interacting with the AI mentor.
- User Dashboard: A basic user dashboard displaying current attendance status and the number of unread emails.
- Database Integration: Storing of user data, attendance logs, and chat history in Cloud Firestore and educational documents using Firebase Data Connect with Cloud SQL

## Style Guidelines:

- Primary color: Deep indigo (#4B0082) for focus and intellect.
- Background color: Light gray (#E5E7E9), subtly tinted with indigo (desaturated 20% and lightened) for a calm learning environment.
- Accent color: Muted purple (#800080), for interactive elements and highlights.
- Headline font: 'Space Grotesk', sans-serif for a modern, technical feel. Body text: 'Inter', sans-serif for longer sections.
- Clean and simple icons representing different subjects and functionalities (e.g., book for study guides, envelope for email, calendar for attendance).
- Clear and intuitive layout with a focus on readability and easy navigation. Dashboard widgets should be easily scannable.
- Subtle transitions and animations to provide feedback and enhance the user experience (e.g., loading animations, message send confirmations).