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
            // Clicking a danger row removes it from the matched set, so the list
            // shrinks as we go. Snapshotting with all() and indexing nth() breaks:
            // after a few clicks the higher indices are detached and the click
            // hangs for the full test timeout. Count once, then always click the
            // current first() — the next danger row falls into first() each pass.
            const dangerCheck = this.page.locator('.bg-white > .text-danger');
            const count = await dangerCheck.count();
            for(let i = 0; i < count; i++) {
                await dangerCheck.first().click();
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