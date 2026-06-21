import { Page } from "@playwright/test";
import { GeneralUtils } from "./general.utils";

export class CampaignUtils {
    page: Page;

    increaseAirlineReputation: boolean = false;
    campaignType: number = 1;
    campaignDuration: number = 4;

    constructor(page: Page) {
        if(process.env.INCREASE_AIRLINE_REPUTATION === 'true') {
            this.increaseAirlineReputation = true;
            this.campaignType = this.parseNumericEnv('CAMPAIGN_TYPE');
            this.campaignDuration = this.parseNumericEnv('CAMPAIGN_DURATION');
        }

        this.page = page;
    }

    private parseNumericEnv(name: string): number {
        const rawValue = process.env[name];
        if (rawValue === undefined || rawValue.trim() === '') {
            throw new Error(`${name} must be set when INCREASE_AIRLINE_REPUTATION is true`);
        }

        const parsedValue = Number(rawValue);
        if (!Number.isFinite(parsedValue)) {
            throw new Error(`${name} must be a numeric value, received "${rawValue}"`);
        }

        return parsedValue;
    }

    private async createEcoFriendly(): Promise<void> {
        const isEcoFriendExists = await this.page.getByRole('cell', { name: ' Eco friendly' }).isVisible();
        if(!isEcoFriendExists) {
            await this.page.getByRole('button', { name: ' New campaign' }).click();
            await this.page.getByRole('cell', { name: 'Eco-friendly Increases' }).click();
            await this.page.getByRole('button', { name: '$' }).click();
        }
    }

    private async createReputation(): Promise<void> {
        const campaignType = this.campaignType.toString();
        const durationOption = (Math.floor(this.campaignDuration / 4) || 1).toString();

        const isAirlineReputationExists = await this.page.getByRole('cell', { name: ' Airline reputation' }).isVisible();
        if (!isAirlineReputationExists) {
            await this.page.getByRole('button', { name: ' New campaign' }).click();
            await this.page.getByRole('cell', { name: 'Increase airline reputation' }).click();
            await this.page.locator('#dSelector').selectOption(durationOption);
            await this.page.locator(`tr:has(td:has-text("Campaign ${campaignType}")) .btn-danger`).click();
        }
    }

    public async createCampaign(): Promise<void> {
        await this.page.getByRole('button', { name: ' Marketing' }).click();

        await GeneralUtils.sleep(1000);

        await this.createEcoFriendly();

        if(this.increaseAirlineReputation) {
            await this.createReputation();
        }
    }
}
