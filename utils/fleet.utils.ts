import { Page } from "@playwright/test";
import { GeneralUtils } from "./general.utils";

require('dotenv').config();

// Caps the depart loop so it cannot spin forever when no fuel is available;
// each iteration departs up to 20 planes, so 8 attempts covers a full fleet.
const MAX_DEPART_ATTEMPTS = 8;

export class FleetUtils {
    private readonly page: Page;

    constructor(page : Page) {
        this.page = page;
    }

    public async departPlanes(): Promise<void> {
        const departAll = this.page.locator('#departAll');
        let departAllVisible = await departAll.isVisible();

        let count = 0;
        while (departAllVisible && count < MAX_DEPART_ATTEMPTS) {
            await departAll.click();
            await GeneralUtils.sleep(1500);

            const cantDepartPlane = await this.page.getByText('×Unable to departSome A/C was').isVisible();
            if (cantDepartPlane)
                break;

            departAllVisible = await departAll.isVisible();
            count++;
        }
    }
}
