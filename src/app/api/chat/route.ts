import { NextResponse } from 'next/server';

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
  quick_replies?: string[];
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const messages: ChatMessage[] = body.messages || [];

    // Count user responses to progress through fixed onboarding sequence
    const userMessageCount = messages.filter((m) => m.role === 'user').length;

    let responseMessage: ChatMessage;
    let isDone = false;

    switch (userMessageCount) {
      case 0:
        responseMessage = {
          role: 'ai',
          text: 'What are you trying to achieve? (e.g. "I want to master Full Stack Web Development")',
        };
        break;
      case 1:
        responseMessage = {
          role: 'ai',
          text: "What's your current experience level?",
          quick_replies: ['Beginner', 'Intermediate', 'Advanced'],
        };
        break;
      case 2:
        responseMessage = {
          role: 'ai',
          text: 'How many hours per week can you dedicate to learning?',
          quick_replies: ['2-5 hours', '5-10 hours', '10-20 hours', '20+ hours'],
        };
        break;
      case 3:
        responseMessage = {
          role: 'ai',
          text: 'What is your preferred learning style?',
          quick_replies: ['Project-based', 'Video courses', 'Reading/Articles', 'Interactive quizzes'],
        };
        break;
      default:
        responseMessage = {
          role: 'ai',
          text: 'Awesome! We have collected all your preferences and are finalizing your learner profile.',
        };
        isDone = true;
        break;
    }

    return NextResponse.json({
      message: responseMessage,
      done: isDone,
    });
  } catch (error) {
    console.error('Error in /api/chat route:', error);
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    );
  }
}
