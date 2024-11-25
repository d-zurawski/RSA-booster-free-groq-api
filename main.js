/**
 * Creates custom menu when spreadsheet opens
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('RSA Booster - Free Groq API')
    .addItem('Generate alternative assets', 'promptUserForModel')
    .addToUi();
}

/**
 * Prompts the user to select a model before generating alternatives
 */
function promptUserForModel() {
  const models = [
    'distil-whisper-large-v3-en',
    'gemma2-9b-it',
    'gemma-7b-it',
    'llama3-groq-70b-8192-tool-use-preview',
    'llama3-groq-8b-8192-tool-use-preview',
    'llama-3.1-70b-versatile',
    'llama-3.1-70b-specdec',
    'llama-3.1-8b-instant',
    'llama-3.2-1b-preview',
    'llama-3.2-3b-preview',
    'llama-3.2-11b-vision-preview',
    'llama-3.2-90b-vision-preview',
    'llama-guard-3-8b',
    'llama3-70b-8192',
    'llama3-8b-8192',
    'mixtral-8x7b-32768',
    'whisper-large-v3',
    'whisper-large-v3-turbo'
  ];

  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Select Model',
    `Enter the model ID from the following options:\n${models.join('\n')}`,
    ui.ButtonSet.OK_CANCEL
  );

  if (response.getSelectedButton() === ui.Button.OK) {
    const selectedModel = response.getResponseText().trim();
    if (models.includes(selectedModel)) {
      generateGroqAlternatives(selectedModel);
    } else {
      ui.alert('Invalid model ID. Please try again.');
    }
  } else {
    ui.alert('Action canceled.');
  }
}

/**
 * Main function to generate alternative assets
 * @param {string} selectedModel The model selected by the user
 */
function generateGroqAlternatives(selectedModel) {
  const SHEET_NAME = 'New Assets';
  const REPORT_SHEET_NAME = 'Report';
  const REQUIRED_COLUMNS = [
    'Campaign', 'Ad group', 'Ad label', 'Asset type',
    'Low performing asset text', 'Alternative 1', 'Alternative 2', 'Alternative 3'
  ];
  const PERFORMANCE_LABEL_COL = 9; // Column I contains Performance Label
  const CAMPAIGN_COL = 1; // Column A
  const ADGROUP_COL = 2; // Column B
  const AD_LABEL_COL = 3; // Column C
  const ASSET_TYPE_COL = 7; // Column G
  const ASSET_TEXT_COL = 8; // Column H
  const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

  const apiKey = PropertiesService.getScriptProperties().getProperty('GROQ_API_KEY');
  if (!apiKey) {
    SpreadsheetApp.getUi().alert('Groq API key not found. Please set it in Script Properties.');
    return;
  }

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const reportSheet = ss.getSheetByName(REPORT_SHEET_NAME);
  if (!reportSheet) {
    SpreadsheetApp.getUi().alert(`Report sheet "${REPORT_SHEET_NAME}" not found.`);
    return;
  }

  const newAssetsSheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  const existingHeaders = newAssetsSheet.getRange(1, 1, 1, newAssetsSheet.getLastColumn()).getValues()[0];

  if (!existingHeaders || existingHeaders.length === 0 || !REQUIRED_COLUMNS.every((col, i) => col === existingHeaders[i])) {
    newAssetsSheet.clear();
    newAssetsSheet.getRange(1, 1, 1, REQUIRED_COLUMNS.length).setValues([REQUIRED_COLUMNS]);
    newAssetsSheet.getRange(1, 1, 1, REQUIRED_COLUMNS.length).setBackground('#E8EAED').setFontWeight('bold');
    for (let i = 1; i <= REQUIRED_COLUMNS.length; i++) {
      newAssetsSheet.autoResizeColumn(i);
    }
  }

  const reportData = reportSheet.getDataRange().getValues();
  const lowPerformingAssets = reportData.slice(1)
    .filter(row => row[PERFORMANCE_LABEL_COL - 1] === 'LOW')
    .map(row => ({
      campaign: row[CAMPAIGN_COL - 1],
      adGroup: row[ADGROUP_COL - 1],
      adLabel: row[AD_LABEL_COL - 1],
      assetType: row[ASSET_TYPE_COL - 1],
      assetText: row[ASSET_TEXT_COL - 1]
    }));

  if (lowPerformingAssets.length === 0) {
    SpreadsheetApp.getUi().alert('No low-performing assets found.');
    return;
  }

  const results = [];
  lowPerformingAssets.forEach(asset => {
    try {
      const maxLength = asset.assetType.toLowerCase() === 'headline' ? 30 : 90;

      const requestBody = {
        model: selectedModel,
        messages: [
          {
            role: "user",
            content: `Generate 3 alternative ${asset.assetType.toLowerCase()}s for the following text: "${asset.assetText}".
            Requirements:
            - Each alternative must be under ${maxLength} characters
            - Make them engaging and action-oriented
            - Focus on benefits and unique value propositions
            - Each must be distinct from the others
            - Return exactly 3 alternatives, one per line
            - Do not include numbering or bullet points
            - Do not include any additional text or explanations
            - Detect the language used, and provide an answer in the same language
            
            Example format:
            First alternative
            Second alternative
            Third alternative`
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      };

      const options = {
        method: 'post',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        payload: JSON.stringify(requestBody),
        muteHttpExceptions: true
      };

      const response = UrlFetchApp.fetch(GROQ_ENDPOINT, options);
      const jsonResponse = JSON.parse(response.getContentText());

      Logger.log(`API Response for "${asset.assetText}": ${JSON.stringify(jsonResponse)}`);

      if (jsonResponse.error) {
        throw new Error(`Groq API Error: ${jsonResponse.error.message}`);
      }

      const content = jsonResponse.choices[0]?.message?.content || '';
      const alternatives = content.split('\n')
        .map(line => line.replace(/^[\d.]+/, '').trim())
        .filter(line => line.length > 0 && line.length <= maxLength);

      if (alternatives.length >= 3) {
        results.push([
          asset.campaign, asset.adGroup, asset.adLabel, asset.assetType,
          asset.assetText, alternatives[0], alternatives[1], alternatives[2]
        ]);
      } else {
        Logger.log(`Insufficient alternatives generated for: ${asset.assetText}`);
      }
    } catch (error) {
      Logger.log(`Error processing asset: ${asset.assetText} - ${error.message}`);
    }
  });

  if (results.length > 0) {
    const nextRow = newAssetsSheet.getLastRow() + 1;
    newAssetsSheet.getRange(nextRow, 1, results.length, REQUIRED_COLUMNS.length).setValues(results);
    SpreadsheetApp.getUi().alert(`Processing complete! Processed ${results.length} assets.`);
  } else {
    SpreadsheetApp.getUi().alert('No alternatives generated. Please check the logs for details.');
  }
}
