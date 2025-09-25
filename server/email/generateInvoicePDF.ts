// import puppeteer from 'puppeteer';

// export async function generateInvoicePDF(invoiceUrl: string): Promise<Buffer> {
//   const browser = await puppeteer.launch({
//     headless: true,
//     args: ['--no-sandbox', '--disable-setuid-sandbox'],
//   });

//   const page = await browser.newPage();

//   await page.goto(invoiceUrl, { waitUntil: 'networkidle0' });

//   const pdfUint8Array = await page.pdf({
//     format: 'A4',
//     printBackground: true,
//     margin: { top: '30px', bottom: '30px', left: '20px', right: '20px' },
//   });

//   await browser.close();

//   const pdfBuffer = Buffer.from(pdfUint8Array);

//   return pdfBuffer;
// }

import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';
import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

Handlebars.registerHelper('eq', function(arg1, arg2) {
  return arg1 === arg2;
});

export async function generateInvoicePDF(
  templateName: string,
  invoiceData: any
): Promise<Buffer> {
  // Read and convert images to data URLs
  const headerPath = path.resolve(process.cwd(), 'client/public/header.png');
  const footerPath = path.resolve(process.cwd(), 'client/public/footer.png');
  
  const headerImageBuffer = fs.readFileSync(headerPath);
  const footerImageBuffer = fs.readFileSync(footerPath);
  
  const headerImageDataUrl = `data:image/png;base64,${headerImageBuffer.toString('base64')}`;
  const footerImageDataUrl = `data:image/png;base64,${footerImageBuffer.toString('base64')}`;

  const templatePath = path.resolve(__dirname, 'templates', `${templateName}.hbs`);
  const templateHtml = fs.readFileSync(templatePath, 'utf-8');
  const template = Handlebars.compile(templateHtml);

  const html = template({
    ...invoiceData,
    headerImageDataUrl,
    footerImageDataUrl
  });

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });

  const pdfUint8Array = await page.pdf({ format: 'A4', printBackground: true });

  await browser.close();

  return Buffer.from(pdfUint8Array);
}
