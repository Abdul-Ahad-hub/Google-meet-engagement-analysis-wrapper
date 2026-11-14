import { HttpStatus } from '@nestjs/common';
import { AppException } from './App.Exceptions';

/** Thrown when calling the downstream Engagement-Analysis-System fails or times out. */
export class EngineCommunicationException extends AppException {
  constructor(details?: Record<string, unknown>, status: HttpStatus = HttpStatus.BAD_GATEWAY) {
    super(
      'ENGINE_COMMUNICATION_FAILED',
      'Failed to communicate with the core engagement analysis engine.',
      status,
      details,
    );
  }
}

/** Thrown when the repository layer fails to persist or read Google Meet session data. */
export class PersistenceException extends AppException {
  constructor(details?: Record<string, unknown>) {
    super(
      'PERSISTENCE_FAILED',
      'A data persistence error occurred.',
      HttpStatus.INTERNAL_SERVER_ERROR,
      details,
    );
  }
}
