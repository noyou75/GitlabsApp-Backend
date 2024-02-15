import * as Juice from 'juice';
import { loadFile } from '../../../common/file.utils';

let styles = null;

/**
 * This method inlines styles from the email stylesheet directly into html
 * elements for better compatibility with email clients.
 */
export const inlineEmailCss = (html: string): string => {
  if (!styles) {
    styles = loadFile('views/notifications/email.css');
  }
  return Juice.inlineContent(html, styles, {
    preserveMediaQueries: true,
  });
};
