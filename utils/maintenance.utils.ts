import { Page } from "@playwright/test";
import { GeneralUtils } from "./general.utils";

export class MaintenanceUtils {
    private static readonly REPAIR_PCT_THRESHOLD = 60;

    private readonly page: Page;

    constructor(page : Page) {
        this.page = page;
    }

    public async repairPlanes(): Promise<void> {
        await this.page.getByRole('button', { name: ' Plan' }).click();
        await this.page.getByRole('button', { name: ' Bulk repair' }).click();
        await this.page.locator('#repairPct').selectOption(String(MaintenanceUtils.REPAIR_PCT_THRESHOLD));
        await GeneralUtils.sleep(1000);
        const noPlaneExists = await this.page.getByText('There are no aircraft worn to').isVisible();
        if(!noPlaneExists) {
            const planButton = this.page.getByRole('button', { name: 'Plan bulk repair' });
            if(await planButton.isVisible()) {
                await planButton.click();
            }
        }
    }

    public async checkPlanes(): Promise<void> {
        await this.page.getByRole('button', { name: ' Plan' }).click();
        await this.page.getByRole('button', { name: ' Bulk check' }).click();

        await GeneralUtils.sleep(2000);
        let clicked = false;

        // Click only planes with danger text
        const dangerChecksExits = await this.page.locator('.bg-white > .text-danger').first().isVisible();
        if(dangerChecksExits) {
            // Collect all matching elements up front. Playwright locators are live, so
            // calling first() each iteration after a click can shift DOM positions and
            // cause elements to be skipped or double-clicked. all() snapshots the list.
            const allCheckHoursDanger = await this.page.locator('.bg-white > .text-danger').all();
            for(const element of allCheckHoursDanger) {
                await element.click();
                clicked = true;

                await GeneralUtils.sleep(500);
            }
        }

        if(clicked) {
            const planButton = this.page.getByRole('button', { name: 'Plan bulk check' });
            if(await planButton.isVisible()) {
                await planButton.click();
            }
        }
    }
}