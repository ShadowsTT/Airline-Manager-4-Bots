import { Page } from "@playwright/test";

require('dotenv').config();

/**
 * Automates buying Fuel and CO2 on the Airline Manager market page.
 *
 * Both commodities share the same purchase flow, so the buy logic lives in a
 * single generic {@link FuelUtils.buyCommodity} method and the public
 * {@link FuelUtils.buyFuel} / {@link FuelUtils.buyCo2} methods just supply the
 * commodity-specific thresholds.
 */
export class FuelUtils {
    /** Buy this many litres of fuel in bulk when it is cheap but holdings are low. */
    private static readonly FUEL_BULK_AMOUNT = 2_000_000;
    /** Fuel is considered "cheap enough" to bulk-buy below this price. */
    private static readonly FUEL_CHEAP_THRESHOLD = 1250;
    /** Buy this much CO2 in bulk when it is cheap but holdings are low. */
    private static readonly CO2_BULK_AMOUNT = 1_000_000;
    /** CO2 is considered "cheap enough" to bulk-buy below this price. */
    private static readonly CO2_CHEAP_THRESHOLD = 180;

    private readonly maxFuelPrice: number;
    private readonly maxCo2Price: number;
    private readonly debugEnabled: boolean;

    private readonly page: Page;

    constructor(page: Page) {
        this.maxFuelPrice = FuelUtils.parsePrice('MAX_FUEL_PRICE', process.env.MAX_FUEL_PRICE);
        this.maxCo2Price = FuelUtils.parsePrice('MAX_CO2_PRICE', process.env.MAX_CO2_PRICE);
        this.debugEnabled = process.env.FUEL_UTILS_DEBUG === 'true';
        this.page = page;

        this.log("Max Fuel Price: " + this.maxFuelPrice);
        this.log("Max Co2 Price: " + this.maxCo2Price);
    }

    /**
     * Validates that a required price env var is set and numeric.
     * @throws Error with a descriptive message when missing or non-numeric.
     */
    private static parsePrice(name: string, raw: string | undefined): number {
        if (raw === undefined || raw.trim() === '') {
            throw new Error(`Environment variable ${name} is required but was not set.`);
        }

        const value = parseInt(raw, 10);
        if (Number.isNaN(value)) {
            throw new Error(`Environment variable ${name} must be a numeric value, but got "${raw}".`);
        }

        return value;
    }

    public async buyFuel(): Promise<void> {
        await this.buyCommodity(
            'Fuel',
            ' Litres',
            this.maxFuelPrice,
            FuelUtils.FUEL_BULK_AMOUNT,
            FuelUtils.FUEL_CHEAP_THRESHOLD,
            FuelUtils.FUEL_BULK_AMOUNT,
        );
    }

    public async buyCo2(): Promise<void> {
        await this.buyCommodity(
            'Co2',
            '',
            this.maxCo2Price,
            FuelUtils.CO2_BULK_AMOUNT,
            FuelUtils.CO2_CHEAP_THRESHOLD,
            FuelUtils.CO2_BULK_AMOUNT,
        );
    }

    /**
     * Generic buy routine shared by fuel and CO2.
     *
     * Buying behaviour (unchanged from the original per-commodity methods):
     *  - Skip entirely when there is no empty capacity to fill.
     *  - If the current price is below {@link maxPrice}, fill the remaining capacity.
     *  - Otherwise, if holdings are below {@link minHoldingThreshold} and the price is
     *    below {@link minHoldingPrice}, buy a fixed {@link bulkAmount}.
     *
     * @param label              Display name used in log messages (e.g. "Fuel").
     * @param unit               Unit suffix appended to "amount bought" logs (e.g. " Litres").
     * @param maxPrice           Buy all remaining capacity below this price.
     * @param minHoldingThreshold Only bulk-buy while current holdings are below this.
     * @param minHoldingPrice    Only bulk-buy while the price is below this.
     * @param bulkAmount         Fixed amount to buy on the bulk branch.
     */
    private async buyCommodity(
        label: string,
        unit: string,
        maxPrice: number,
        minHoldingThreshold: number,
        minHoldingPrice: number,
        bulkAmount: number,
    ): Promise<void> {
        this.log(`Buying ${label}...`);

        const emptyCapacity = await this.getEmptyCapacity();
        if (emptyCapacity === 0) {
            return;
        }

        const currentPrice = await this.getCurrentPrice();
        const currentHolding = await this.getCurrentHolding();

        this.log(`Current ${label} Price: ${currentPrice}`);

        // Buy all remaining capacity while the price is below the max price.
        if (currentPrice < maxPrice) {
            const capacityText = await this.getEmptyCapacityText();
            await this.purchase(capacityText);

            this.log(`Bought ${label} Successfully! Amount of ${label.toLowerCase()} bought: ${capacityText}${unit}`);
        }
        // Otherwise top up in bulk while holdings are low and the price is still cheap.
        else if (currentHolding < minHoldingThreshold && currentPrice < minHoldingPrice) {
            await this.purchase(String(bulkAmount));

            this.log(`Bought ${label} Successfully! Amount of ${label.toLowerCase()} bought: ${bulkAmount}${unit}`);
        }
    }

    /** Reads the live "Total price" shown for the pending purchase. */
    private async getCurrentPrice(): Promise<number> {
        const priceText = (await this.page.getByText('Total price$').locator('b > span').innerText()).replaceAll(',', '');

        return parseInt(priceText, 10);
    }

    /** Reads the amount of the commodity currently held. */
    private async getCurrentHolding(): Promise<number> {
        const holdingText = (await this.page.locator('#holding').innerText()).replaceAll(',', '');

        return parseInt(holdingText, 10);
    }

    /** Remaining (empty) capacity as the raw, comma-stripped page text. */
    private async getEmptyCapacityText(): Promise<string> {
        return (await this.page.locator('#remCapacity').innerText()).replaceAll(',', '');
    }

    /** Remaining (empty) capacity parsed to a number. */
    private async getEmptyCapacity(): Promise<number> {
        return parseInt(await this.getEmptyCapacityText(), 10);
    }

    /** Fills the purchase amount field and clicks the Purchase button. */
    private async purchase(amount: string): Promise<void> {
        const amountInput = this.page.getByPlaceholder('Amount to purchase');

        await amountInput.click();
        await amountInput.press('Control+a');
        await amountInput.fill(amount);
        await this.page.getByRole('button', { name: ' Purchase' }).click();
    }

    /** Minimal, toggleable logging. Enable by setting FUEL_UTILS_DEBUG=true. */
    private log(message: string): void {
        if (this.debugEnabled) {
            console.log(message);
        }
    }
}
