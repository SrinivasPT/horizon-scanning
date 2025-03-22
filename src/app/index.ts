import { chromium, Browser, Page } from 'playwright';
import { config } from 'dotenv';
import * as path from 'path';
import { promises as fs } from 'fs';
import { createObjectCsvWriter } from 'csv-writer';

// Load environment variables
config();

interface SiteConfig {
  url: string;
  name: string;
  selectors: {
    [key: string]: string;
  };
  actions?: Array<{
    type: 'click' | 'fill' | 'wait' | 'navigate';
    selector?: string;
    value?: string; 
    timeout?: number;
  }>;
}

interface ScrapedData {
  siteName: string;
  timestamp: string;
  [key: string]: string | number;
}

async function setupBrowser() {
  const browser = await chromium.launch({
    headless: process.env.HEADLESS !== 'false',
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36',
  });
  
  return { browser, context };
}

async function performActions(page: Page, actions: SiteConfig['actions']) {
  if (!actions) return;
  
  for (const action of actions) {
    try {
      switch (action.type) {
        case 'click':
          if (action.selector) {
            await page.click(action.selector, { timeout: action.timeout || 5000 });
          }
          break;
        case 'fill':
          if (action.selector && action.value) {
            await page.fill(action.selector, action.value, { timeout: action.timeout || 5000 });
          }
          break;
        case 'wait':
          if (action.timeout) {
            await page.waitForTimeout(action.timeout);
          } else if (action.selector) {
            await page.waitForSelector(action.selector, { timeout: action.timeout || 30000 });
          }
          break;
        case 'navigate':
          if (action.value) {
            await page.goto(action.value, { timeout: action.timeout || 30000 });
          }
          break;
      }
    } catch (error) {
      console.error(`Error performing action ${action.type}:`, error);
    }
  }
}

async function scrapeSite(page: Page, siteConfig: SiteConfig): Promise<ScrapedData> {
  const data: ScrapedData = {
    siteName: siteConfig.name,
    timestamp: new Date().toISOString(),
  };
  
  try {
    // Navigate to the site
    await page.goto(siteConfig.url, { waitUntil: 'networkidle' });
    
    // Perform any predefined actions
    if (siteConfig.actions) {
      await performActions(page, siteConfig.actions);
    }
    
    // Extract data using selectors
    for (const [key, selector] of Object.entries(siteConfig.selectors)) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        const element = await page.$(selector);
        if (element) {
          const text = await element.textContent();
          data[key] = text?.trim() || '';
        }
      } catch (error) {
        console.error(`Error extracting ${key} from ${siteConfig.name}:`, error);
        data[key] = 'N/A';
      }
    }
    
    // Take a screenshot
    const screenshotsDir = path.join(process.cwd(), 'screenshots');
    await fs.mkdir(screenshotsDir, { recursive: true });
    await page.screenshot({ 
      path: path.join(screenshotsDir, `${siteConfig.name}-${Date.now()}.png`),
      fullPage: true 
    });
    
  } catch (error) {
    console.error(`Error scraping ${siteConfig.name}:`, error);
  }
  
  return data;
}

async function saveDataToCSV(data: ScrapedData[]) {
  if (data.length === 0) return;
  
  // Create headers based on the first data object
  const allKeys = new Set<string>();
  data.forEach(item => {
    Object.keys(item).forEach(key => allKeys.add(key));
  });
  
  const headers = Array.from(allKeys).map(key => ({
    id: key,
    title: key
  }));
  
  const csvWriter = createObjectCsvWriter({
    path: path.join(process.cwd(), 'data', `scrape-results-${Date.now()}.csv`),
    header: headers
  });
  
  await fs.mkdir(path.join(process.cwd(), 'data'), { recursive: true });
  await csvWriter.writeRecords(data);
  console.log('Data saved to CSV file');
}

async function main() {
  // Load site configurations
  const configPath = path.join(process.cwd(), 'src', 'site-configs.json');
  const configFile = await fs.readFile(configPath, 'utf-8');
  const siteConfigs: SiteConfig[] = JSON.parse(configFile);
  
  const { browser, context } = await setupBrowser();
  const allData: ScrapedData[] = [];
  
  try {
    for (const siteConfig of siteConfigs) {
      console.log(`Scraping ${siteConfig.name}...`);
      const page = await context.newPage();
      
      try {
        const data = await scrapeSite(page, siteConfig);
        allData.push(data);
        console.log(`Completed scraping ${siteConfig.name}`);
      } catch (error) {
        console.error(`Failed to scrape ${siteConfig.name}:`, error);
      } finally {
        await page.close();
      }
    }
    
    // Save all scraped data
    await saveDataToCSV(allData);
    
  } finally {
    await browser.close();
  }
}

// Run the main function
main().catch(console.error);
