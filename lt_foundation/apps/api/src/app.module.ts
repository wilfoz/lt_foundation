import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FoundationDesignModule } from './modules/foundation-design/foundation-design.module';
import { ProjectIngestionModule } from './modules/project-ingestion/project-ingestion.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    FoundationDesignModule,
    ProjectIngestionModule,
  ],
})
export class AppModule {}
