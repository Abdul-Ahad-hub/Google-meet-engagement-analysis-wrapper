import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';
import { AppModule } from './app.module';

let cachedServer: Express | null = null;

export async function createConfiguredApp(): Promise<{
  app: NestExpressApplication;
  expressApp: Express;
}> {
  const expressApp = express();
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(expressApp),
  );

  const bodyLimit = process.env.BODY_LIMIT ?? '10mb';
  app.useBodyParser('json', { limit: bodyLimit });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.enableCors();
  return { app, expressApp };
}

async function bootstrap() {
  const { app } = await createConfiguredApp();
  app.enableShutdownHooks();

  const port = Number(process.env.PORT ?? 3001);
  const bodyLimit = process.env.BODY_LIMIT ?? '10mb';
  await app.listen(port);
  Logger.log(`Listening on http://localhost:${port} (body limit ${bodyLimit})`, 'Bootstrap');
}

if (!process.env.VERCEL) {
  bootstrap();
}

export default async function handler(req: Request, res: Response) {
  if (!cachedServer) {
    const { app, expressApp } = await createConfiguredApp();
    await app.init();
    cachedServer = expressApp;
  }
  return cachedServer(req, res);
}
