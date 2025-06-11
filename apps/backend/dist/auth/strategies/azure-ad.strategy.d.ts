import { ConfigService } from '@nestjs/config';
declare const AzureAdStrategy_base: new (...args: any[]) => any;
export declare class AzureAdStrategy extends AzureAdStrategy_base {
    private readonly configService;
    constructor(configService: ConfigService);
    validate(payload: any): Promise<any>;
}
export {};
