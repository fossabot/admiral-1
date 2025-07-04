import { TextTransform } from '@mui/material/styles';
import { TypographyStyle, TypographyStyleOptions, TypographyUtils } from '@mui/material/styles/createtypography';

// Augment the createTypography module
declare module '@mui/material/styles/createTypography' {
  // Extend FontStyle to include textTransform and flexible fontSize
  interface FontStyle {
    textTransform: TextTransform;
    fontSize: string | number;
  }

  // Extend FontStyleOptions for optional properties
  interface FontStyleOptions extends Partial<FontStyle> {
    fontSize?: string | number;
  }

  // Define custom typography variants
  export type Variant =
    | 'customInput'
    | 'mainContent'
    | 'menuCaption'
    | 'subMenuCaption'
    | 'commonAvatar'
    | 'smallAvatar'
    | 'mediumAvatar'
    | 'largeAvatar';

  // Extend TypographyOptions to include custom variants
  interface TypographyOptions extends Partial<Record<Variant, TypographyStyleOptions> & FontStyleOptions> {
    customInput?: TypographyStyleOptions;
    mainContent?: TypographyStyleOptions;
    menuCaption?: TypographyStyleOptions;
    subMenuCaption?: TypographyStyleOptions;
    commonAvatar?: TypographyStyleOptions;
    smallAvatar?: TypographyStyleOptions;
    mediumAvatar?: TypographyStyleOptions;
    largeAvatar?: TypographyStyleOptions;
  }

  // Extend Typography to include custom variants
  interface Typography extends Record<Variant, TypographyStyle>, FontStyle, TypographyUtils {
    customInput: TypographyStyle;
    mainContent: TypographyStyle;
    menuCaption: TypographyStyle; // Changed to TypographyStyle
    subMenuCaption: TypographyStyle; // Changed to TypographyStyle
    commonAvatar: TypographyStyle;
    smallAvatar: TypographyStyle;
    mediumAvatar: TypographyStyle;
    largeAvatar: TypographyStyle;
  }
}

// Extend TypographyVariantsOptions to include custom variants
declare module '@mui/material/styles' {
  interface TypographyVariants {
    customInput: TypographyStyle;
    mainContent: TypographyStyle;
    menuCaption: TypographyStyle;
    subMenuCaption: TypographyStyle;
    commonAvatar: TypographyStyle;
    smallAvatar: TypographyStyle;
    mediumAvatar: TypographyStyle;
    largeAvatar: TypographyStyle;
  }

  // Extend TypographyVariantsOptions for theme options
  interface TypographyVariantsOptions {
    customInput?: TypographyStyleOptions;
    mainContent?: TypographyStyleOptions;
    menuCaption?: TypographyStyleOptions;
    subMenuCaption?: TypographyStyleOptions;
    commonAvatar?: TypographyStyleOptions;
    smallAvatar?: TypographyStyleOptions;
    mediumAvatar?: TypographyStyleOptions;
    largeAvatar?: TypographyStyleOptions;
  }
}

// Extend Typography component props to support custom variants
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    customInput: true;
    mainContent: true;
    menuCaption: true;
    subMenuCaption: true;
    commonAvatar: true;
    smallAvatar: true;
    mediumAvatar: true;
    largeAvatar: true;
  }
}
