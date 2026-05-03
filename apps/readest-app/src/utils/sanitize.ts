import DOMPurify from 'isomorphic-dompurify';

export const sanitizeString = (str?: string) => {
  if (!str) return str;
  return str.replace(/\u0000/g, '');
};

export const sanitizeHTML = (html?: string) => {
  if (!html) return '';
  return DOMPurify.sanitize(html);
};
