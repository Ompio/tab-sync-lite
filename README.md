# Tab Sync Lite

## Overview

Tab Sync Lite is a lightweight Firefox extension designed to synchronize browser tabs between multiple computers using your Firefox account. This simple solution allows you to save your current tab session and restore it on another device, helping you maintain workflow continuity.

## Features

- **Save Tabs**: Store your current tab session to Firefox Sync storage
- **Download Tabs**: Retrieve previously saved tabs from sync storage
- **Synchronize Tabs**: Match your current browser state with your saved tabs (closes tabs not in saved state, opens missing tabs)
- **Storage Usage Monitoring**: View current sync storage utilization
- **Session Log**: Track history of saved tab sessions with timestamps

## Installation

### From Firefox Add-ons (Recommended)
1. Visit the Firefox Add-ons store (URL to be added once published)
2. Click "Add to Firefox"
3. Follow the prompts to complete installation

### Manual Installation (Development)
1. Download or clone this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Navigate to the extension directory and select `manifest.json`

## Usage

1. Click the Tab Sync Lite icon in your browser toolbar to open the popup
2. Use the following buttons:
   - **Save Current Tabs**: Stores all your current tabs to sync storage
   - **Download Tabs**: Loads previously saved tabs from sync storage
   - **Synchronize Tabs**: Adjusts your current tabs to match saved session:
     - Closes tabs that aren't in your saved session
     - Opens tabs that are in your saved session but not currently open

## Storage Limitations

This extension uses Firefox's sync storage which has a limit of 100KB. The memory usage indicator in the popup helps you monitor your storage utilization. If you're approaching the limit, consider reducing the number of tabs you sync.

## Privacy & Security

Tab Sync Lite stores data using Firefox's built-in sync functionality, ensuring your data is:
- Encrypted using your Firefox account credentials
- Not accessible to the extension developers
- Not shared with any third parties

## Requirements

- Firefox 58.0 or newer
- A Firefox Account (required for sync functionality)

## Support & Contributing

For issues, suggestions, or contributions:
1. Open an issue in the GitHub repository
2. Fork the repository and submit a pull request

## Planned Features

The following features are planned for future versions:

- **Automatic Synchronization**: Enable automatic syncing of tabs without manual intervention
- **Tab Profiles**: Create and manage different tab sets for various workflows
- **Enhanced Capacity**: Support for approximately 1000 tabs (subject to validation with sync storage limits)
- **Additional Functionality**: More features to improve tab management experience

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

The MIT License is a permissive license that allows anyone to use, modify, and distribute this software, even for commercial purposes, provided the original copyright notice and permission notice are included.

## Credits

Tab Sync Lite was created to provide a simple, lightweight tab synchronization solution without unnecessary complexity.
