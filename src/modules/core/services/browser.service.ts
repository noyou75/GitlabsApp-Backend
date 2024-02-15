import { Injectable } from '@nestjs/common';
import { merge } from 'lodash';
import puppeteer from 'puppeteer-core';

@Injectable()
export class BrowserService {
  getBrowserInstance(options?: puppeteer.LaunchOptions): Promise<puppeteer.Browser> {
    options = merge(
      {
        headless: true,
        executablePath: '/usr/bin/chromium-browser',
        pipe: true, // Use a pipe instead of websocket for better reliability
        args: [
          // TODO: Properly sandbox chrome in a separate micro service container.
          //       Disabling sandbox for now since we only render known good content.
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          // '--remote-debugging-port=9222',
          // '--remote-debugging-address=0.0.0.0',
        ],
      },
      options,
    );

    return puppeteer.launch(options);
  }

  async htmlToPdf(html: string, navOptions?: puppeteer.NavigationOptions, pdfOptions?: puppeteer.PDFOptions): Promise<Buffer> {
    const browser = await this.getBrowserInstance();

    navOptions = merge(
      {
        waitUntil: 'networkidle0',
        timeout: 60 * 1000,
      },
      navOptions,
    );

    pdfOptions = merge(
      {
        format: 'Letter',
        printBackground: true,
      },
      pdfOptions,
    );

    try {
      const page = await browser.newPage();
      await page.setContent(html, navOptions);
      return await page.pdf(pdfOptions);
    } finally {
      await browser.close();
    }
  }
}
