import { Page } from "@playwright/test";

require('dotenv').config();

export class GeneralUtils {
    /** Close button shared by every in-game modal popup. */
    private static readonly POPUP_CLOSE_SELECTOR =
        '#popup > .modal-dialog > .modal-content > .modal-header > div > .glyphicons';

    private readonly username: string;
    private readonly password: string;
    private readonly page: Page;

    constructor(page : Page) {
        const email = process.env.EMAIL;
        const password = process.env.PASSWORD;

        if (!email) {
            throw new Error('EMAIL environment variable is required');
        }
        if (!password) {
            throw new Error('PASSWORD environment variable is required');
        }

        this.username = email;
        this.password = password;
        this.page = page;
    }

    public static async sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /** Closes the currently open modal popup via its shared close button. */
    public async closePopup(): Promise<void> {
        await this.page.locator(GeneralUtils.POPUP_CLOSE_SELECTOR).click();
    }

    public async login(): Promise<void> {
        await this.page.goto('https://www.airlinemanager.com/');

        await this.page.getByRole('button', { name: 'PLAY FREE NOW' }).click();
        await this.page.getByRole('button', { name: 'Log in' }).click();
        await this.page.locator('#lEmail').click();
        await this.page.locator('#lEmail').fill(this.username);
        await this.page.locator('#lEmail').press('Tab');
        await this.page.locator('#lPass').click();
        await this.page.locator('#lPass').fill(this.password);
        await this.page.getByRole('button', { name: 'Log In', exact: true }).click();
    }
}
