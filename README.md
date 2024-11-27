# RSA Booster - Free Groq API

**Acknowledgment:** This script is based on the work of [Francesco Cifardi](https://www.linkedin.com/in/francescocifardi/). Without his original script, this enhanced version would not have been possible. Special thanks to Francesco for his contribution and inspiration.

This enhanced Google Apps Script, created by me - [Dawid Żurawski](https://www.linkedin.com/in/dawid-%C5%BCurawski-61a1341b3/), improves upon the original functionality, integrating with Google Sheets to generate alternative ad assets for Responsive Search Ads (RSAs) using the Groq API.

---

## Features

- **Custom Menu:** Adds a "RSA Booster - Free Groq API" menu to your Google Sheet.
- **AI Model Selection:** Choose from a predefined list of AI models for generating alternatives.
- **Automatic Asset Processing:** Identifies low-performing ad assets and generates three engaging alternatives for each.
- **Results Saved in Sheets:** Outputs the generated alternatives to a "New Assets" sheet.

---

## Setup Instructions

1. Open the Google Sheet where you want to run this script.
2. Go to **Extensions > Apps Script**, and paste the code from this repository.
3. Set your **Groq API Key**:
   - In the Apps Script editor, go to **Project Settings > Script Properties**.
   - Go to Groq to get API key:
   - [Groq website](https://prnt.sc/wz5Htt0JR5qH)
   - Add a new property with the key: `GROQ_API_KEY` and paste your API key as the value.
   - [Groq API key creation](https://prnt.sc/XvYHwU5UpbdE)
)
     
4. Save the script and reload your spreadsheet.

---

## How to Use

1. In your spreadsheet, click on the **"RSA Booster - Free Groq API"** menu.
2. Select **"Generate alternative assets"**.
3. Choose an AI model from the prompt.
4. The script will process the data from your "Report" sheet and output results to the "New Assets" sheet.

---

## Requirements

- A valid **Groq API Key**.
- A "Report" sheet in your Google Sheet with the required data columns:
  - Campaign, Ad group, Ad label, Asset type, Low performing asset text, and Performance label (column I marked as "LOW").

---

## Notes

- Ensure the Groq API key is correctly set up in script properties.
- If no low-performing assets are found, the script will notify you.
- Logs are available in the Apps Script editor for troubleshooting.

---

## License

This project is licensed under the MIT License.
