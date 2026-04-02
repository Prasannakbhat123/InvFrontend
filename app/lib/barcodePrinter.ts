import JsBarcode from 'jsbarcode';

/**
 * Converts product ID to EAN-13 compatible format (12 digits)
 * EAN-13 requires exactly 12 digits (13th is auto-calculated check digit)
 */
export const convertToEAN13Format = (productId: string): string => {
  // If already 12-digit numeric, use as-is (new format)
  if (/^\d{12}$/.test(productId)) {
    return productId;
  }
  
  // Extract all digits from product ID
  const digits = productId.replace(/\D/g, '');
  
  if (digits.length === 0) {
    // Default fallback
    return '200000000000';
  }
  
  if (digits.length >= 12) {
    return digits.substring(0, 12);
  }
  
  return digits.padStart(12, '0');
};

/**
 * Calculates EAN-13 check digit (13th digit)
 */
export const calculateEAN13CheckDigit = (code: string): string => {
  if (!/^\d{12}$/.test(code)) {
    return '?';
  }
  
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(code[i]);
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }
  
  const remainder = sum % 10;
  return remainder === 0 ? '0' : String(10 - remainder);
};

/**
 * Generates a barcode image as SVG string using EAN-13 format
 */
export const generateBarcodeImage = (productId: string): string => {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const ean13Code = convertToEAN13Format(productId);
  
  try {
    JsBarcode(svg, ean13Code, {
      format: 'EAN13',
      width: 3,
      height: 100,
      displayValue: true,
      fontSize: 20,
      textMargin: 8,
      margin: 10,
      background: '#FFFFFF',
      lineColor: '#000000',
      valid: function(valid) {
        if (!valid) {
          console.error('EAN-13 validation failed for:', ean13Code);
          throw new Error(`Invalid EAN-13 code: ${ean13Code}`);
        } else {
          console.log('EAN-13 code validated successfully:', ean13Code);
        }
      }
    });
    
    if (!svg.getAttribute('xmlns')) {
      svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    }
    
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'absolute';
    tempContainer.style.visibility = 'hidden';
    tempContainer.style.width = '0';
    tempContainer.style.height = '0';
    tempContainer.appendChild(svg);
    document.body.appendChild(tempContainer);
    
    try {
      const bbox = svg.getBBox();
      if (bbox.width > 0 && bbox.height > 0) {
        const totalWidth = bbox.width + 20;
        const totalHeight = bbox.height + 20;
        svg.setAttribute('width', totalWidth.toString());
        svg.setAttribute('height', totalHeight.toString());
        svg.setAttribute('viewBox', `0 0 ${totalWidth} ${totalHeight}`);
        console.log('Barcode dimensions:', { width: totalWidth, height: totalHeight, bbox });
      } else {
        svg.setAttribute('width', '300');
        svg.setAttribute('height', '150');
        svg.setAttribute('viewBox', '0 0 300 150');
        console.warn('Using fallback dimensions');
      }
    } catch (bboxError) {
      console.warn('Could not get bounding box, using standard EAN-13 dimensions');
      svg.setAttribute('width', '300');
      svg.setAttribute('height', '150');
      svg.setAttribute('viewBox', '0 0 300 150');
    } finally {
      document.body.removeChild(tempContainer);
    }
    
    if (!svg.children || svg.children.length === 0) {
      throw new Error('Barcode generation failed - no elements created in SVG');
    }
    
    const checkDigit = calculateEAN13CheckDigit(ean13Code);
    const fullEAN13 = ean13Code + checkDigit;
    
    console.log('Barcode generated successfully:', {
      productId,
      ean13Code,
      fullEAN13,
      expectedScanResult: fullEAN13,
      svgChildren: svg.children.length,
      svgWidth: svg.getAttribute('width'),
      svgHeight: svg.getAttribute('height'),
      note: 'Scanner should read: ' + fullEAN13
    });
    
    return svg.outerHTML;
  } catch (error) {
    console.error('Error generating barcode:', error);
    throw error;
  }
};

/**
 * Generates TSPL (TSC Printer Language) commands for TSC TE 244 printer
 */
export const generateTSPLCommands = (
  productId: string,
  quantity: number = 1,
  barcodesPerRow: number = 2
): string => {
  const ean13Code = convertToEAN13Format(productId);
  
  // TSC TE 244 specifications: 203 DPI, 4-inch width (108mm max print width)
  // At 203 DPI: 1mm = 8 dots
  const dpi = 203;
  const mmToDots = (mm: number) => Math.round((mm * dpi) / 25.4);
  
  // EAN-13 barcode sizing for good scannability
  // Standard EAN-13 at 100% = 37.29mm wide x 25.93mm tall
  // Using 150% magnification for clear, scannable barcode
  const magnification = 1.5;
  const barcodeWidthMM = 37.29 * magnification; // ~56mm
  const barcodeHeightMM = 25.93 * magnification; // ~39mm
  
  // Label size - optimized for barcode
  const labelWidthMM = 70; // 70mm wide label
  const labelHeightMM = 50; // 50mm tall label
  
  // Bar widths in dots
  const narrowWidth = 4; // 4 dots = ~0.5mm
  const wideWidth = 10;  // 10 dots = ~1.2mm
  
  // Barcode height in dots
  const barcodeHeightDots = mmToDots(barcodeHeightMM);
  
  // Position barcode centered with proper quiet zones
  const quietZoneLeft = mmToDots(7); // Left quiet zone ~7mm
  const barcodeX = quietZoneLeft;
  const barcodeY = mmToDots(5); // 5mm from top
  
  // Validate EAN-13 code
  if (!/^\d{12}$/.test(ean13Code)) {
    throw new Error(`Invalid EAN-13 code: ${ean13Code}. Must be exactly 12 digits.`);
  }
  
  // Build TSPL commands
  let commands = '';
  commands += 'CLS\n';
  commands += `SIZE ${labelWidthMM} mm, ${labelHeightMM} mm\n`;
  commands += 'GAP 2 mm, 0 mm\n';
  commands += 'DIRECTION 1\n';
  commands += 'REFERENCE 0,0\n';
  commands += 'OFFSET 0 mm\n';
  commands += 'SET TEAR ON\n';
  commands += 'SET PEEL OFF\n';
  commands += 'SET CUTTER OFF\n';
  commands += 'DENSITY 10\n'; // Print darkness (0-15, 10 is good balance)
  commands += 'SPEED 2\n'; // Print speed (1-6, 2 is slow for quality)
  
  // Calculate number of barcodes per label (max 2 per row)
  const spacing = mmToDots(5); // 5mm spacing between barcodes
  const barcodesPerLabel = Math.min(barcodesPerRow, 2);
  
  // Generate multiple labels if quantity > barcodesPerLabel
  const totalLabels = Math.ceil(quantity / barcodesPerLabel);
  
  // For each label
  for (let labelNum = 0; labelNum < totalLabels; labelNum++) {
    const barcodesOnThisLabel = Math.min(barcodesPerLabel, quantity - (labelNum * barcodesPerLabel));
    
    for (let i = 0; i < barcodesOnThisLabel; i++) {
      const xPos = barcodeX + (i * (mmToDots(barcodeWidthMM) + spacing));
      commands += `BARCODE ${xPos},${barcodeY},"EAN13",${barcodeHeightDots},1,0,${narrowWidth},${wideWidth},"${ean13Code}"\n`;
    }
  }
  
  commands += `PRINT 1,${totalLabels}\n`;
  
  console.log('=== EAN-13 Barcode Print Configuration ===');
  console.log('Product ID:', productId);
  console.log('EAN-13 Code (12 digits):', ean13Code);
  console.log('Label Size:', `${labelWidthMM}mm × ${labelHeightMM}mm`);
  console.log('Barcode Size:', `${barcodeWidthMM.toFixed(1)}mm × ${barcodeHeightMM.toFixed(1)}mm (${magnification * 100}% magnification)`);
  console.log('Bar Widths:', `narrow=${narrowWidth} dots, wide=${wideWidth} dots`);
  console.log('Barcode Height:', `${barcodeHeightDots} dots`);
  console.log('Position:', `x=${barcodeX} dots, y=${barcodeY} dots`);
  console.log('=========================================');
  
  return commands;
};

/**
 * Converts string to Uint8Array for USB transfer
 */
const stringToUint8Array = (str: string): Uint8Array => {
  const encoder = new TextEncoder();
  return encoder.encode(str);
};

type WebUsbDevice = any;

/**
 * Connects to TSC printer via WebUSB
 */
const connectToPrinter = async (): Promise<WebUsbDevice> => {
  try {
    const filters = [
      { vendorId: 0x04b8 },
      { vendorId: 0x0483 },
    ];

    const usb = (navigator as Navigator & {
      usb?: {
        requestDevice: (options: { filters: Array<{ vendorId: number }> }) => Promise<WebUsbDevice>
      }
    }).usb;

    if (!usb) {
      throw new Error('WebUSB is not supported in this browser.');
    }
    
    const device = await usb.requestDevice({ filters });
    
    if (!device) {
      throw new Error('No printer device selected');
    }
    
    await device.open();
    
    try {
      await device.claimInterface(0);
    } catch (e) {
      try {
        await device.claimInterface(1);
      } catch (e2) {
        console.warn('Could not claim interface, trying without claiming');
      }
    }
    
    return device;
  } catch (error: any) {
    if (error.name === 'NotFoundError') {
      throw new Error('Printer not found. Please make sure it is connected and try again.');
    }
    throw error;
  }
};

/**
 * Sends TSPL commands to printer via WebUSB
 */
const sendToPrinter = async (device: WebUsbDevice, commands: string): Promise<void> => {
  try {
    const data = stringToUint8Array(commands);
    await device.transferOut(1, data);
  } catch (error) {
    try {
      const data = stringToUint8Array(commands);
      await device.transferOut(2, data);
    } catch (e) {
      throw new Error('Failed to send data to printer: ' + (error as Error).message);
    }
  }
};

/**
 * Prints barcode using WebUSB API (primary method)
 */
const printViaWebUSB = async (productId: string, quantity: number = 1): Promise<void> => {
  let device: WebUsbDevice | null = null;
  try {
    device = await connectToPrinter();
    const commands = generateTSPLCommands(productId, quantity);
    
    console.log('TSPL Commands to send:', commands);
    console.log('Command length:', commands.length);
    console.log('Printing quantity:', quantity);
    
    await sendToPrinter(device, commands);
    
    try {
      await device.releaseInterface(0);
    } catch (e) {
      try {
        await device.releaseInterface(1);
      } catch (e2) {
        // Ignore
      }
    }
    
    await device.close();
  } catch (error) {
    if (device) {
      try {
        await device.close();
      } catch (e) {
        // Ignore
      }
    }
    throw error;
  }
};

/**
 * Prints barcode using browser print dialog (fallback method)
 * Optimized for 150mm × 100mm label rolls (15cm × 10cm)
 * Fits 6 barcodes per sheet
 */
const printViaBrowser = (productId: string, productName: string = '', quantity: number = 1, existingWindow?: Window | null): void => {
  const ean13Code = convertToEAN13Format(productId);
  
  // Label dimensions: 150mm (width) × 100mm (height)
  const labelWidth = 150;
  
  // Calculate how many sheets needed (6 barcodes per sheet)
  const barcodesPerSheet = 6;
  const sheetsNeeded = Math.ceil(quantity / barcodesPerSheet);
  
  console.log(`Generating ${quantity} labels across ${sheetsNeeded} sheet(s) for product ${productId}`);
  
  let sheetsHtml = '';
  
  for (let sheet = 0; sheet < sheetsNeeded; sheet++) {
    const barcodesOnThisSheet = Math.min(barcodesPerSheet, quantity - (sheet * barcodesPerSheet));
    
    let barcodeItemsHtml = '';
    for (let i = 0; i < barcodesOnThisSheet; i++) {
      // Generate fresh SVG for each barcode
      const barcodeSvg = generateBarcodeImage(productId);
      
      barcodeItemsHtml += `
        <div class="barcode-item">
          <div class="barcode-container">${barcodeSvg}</div>
        </div>
      `;
    }
    
    sheetsHtml += `
      <div class="label-page">
        ${barcodeItemsHtml}
      </div>
    `;
    
    console.log(`Generated sheet ${sheet + 1} with ${barcodesOnThisSheet} barcode(s)`);
  }
  
  const printWindow = existingWindow || window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please check your popup blocker settings.');
  }
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Barcodes - ${productId}</title>
        <style>
          @media print {
            @page {
              size: ${labelWidth}mm auto;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .no-print {
              display: none;
            }
          }
          * {
            box-sizing: border-box;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            background: white;
          }
          .label-page {
            width: ${labelWidth}mm;
            display: flex;
            flex-direction: column;
            gap: 0mm;
            background: white;
            padding: 1mm 2mm;
            margin: 0 auto 10mm auto;
            page-break-after: always;
          }
          .barcode-item {
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 1mm;
          }
          .barcode-container {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
          }
          .barcode-container svg {
            width: 144mm !important;
            height: 32mm !important;
            max-height: none !important;
          }
          .print-info {
            margin: 10mm;
            padding: 5mm;
            background: #f0f0f0;
            border-radius: 4px;
            font-size: 12px;
            color: #333;
            border: 1px solid #ddd;
          }
          @media print {
            .print-info {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <div class="print-info no-print">
          <strong>Ready to print ${quantity} barcode(s) on ${sheetsNeeded} sheet(s)</strong><br>
          Product: ${productName || productId} | EAN-13: ${ean13Code}<br>
          Label Size: ${labelWidth}mm × auto (6 barcodes per sheet)
        </div>
        ${sheetsHtml}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 500);
          };
        </script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

/**
 * Main function to print barcode label
 */
export const printBarcode = async (
  productId: string,
  productName: string = '',
  quantity: number = 1,
  existingWindow?: Window | null
): Promise<void> => {
  if (!productId) {
    throw new Error('Product ID is required for barcode printing');
  }
  
  const ean13Code = convertToEAN13Format(productId);
  
  if (!/^\d{12}$/.test(ean13Code)) {
    throw new Error(`Invalid EAN-13 format: ${ean13Code}. Must be exactly 12 digits.`);
  }
  
  console.log('Printing EAN-13 barcode:', {
    productId,
    ean13Code,
    fullEAN13: `${ean13Code}${calculateEAN13CheckDigit(ean13Code)}`,
    quantity,
    note: 'Ensure scanner has EAN-13 enabled'
  });
  
  // Check if WebUSB is available and try to use it
  // Note: We don't attempt WebUSB by default as it requires user interaction
  // Users can enable direct USB printing by modifying this code
  // For now, we go straight to browser print for better UX
  
  // Fallback to browser print dialog (default method)
  printViaBrowser(productId, productName, quantity, existingWindow);
};
