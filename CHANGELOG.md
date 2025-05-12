
# Changelog

## [Unreleased]

### Added
- ✨ Per-profile theme tokens with customizable colors, typography, UI density, and icon packs
- ✨ Added ThemeProvider with profile-specific theme loading
- ✨ Added Icon component that supports different icon packs
- ✨ Profile page tabs for better organization of settings
- ✨ Enhanced Impressum feedback system with mandatory field validation
- ✨ Tracking of user validation decisions (correct/incorrect) for each field
- ✨ Improved HTML context collection for corrected values
- ✨ Add feedback capture & nightly export for Impressum scraper
- ✨ Field-level refinement for Impressum import
- ✨ Add scrape_impressum Edge Function
- 🎉 Add Impressum import UI
- ✨ Consolidated buttons into shared component with unified props and functionality
- Added support for custom colors in the Button component
- Added loading state to Button component
- Added icon support with positioning to Button component

### Fixed
- Fixed compatibility issues with asChild and children in Button component
- Fixed size prop types to support existing code
