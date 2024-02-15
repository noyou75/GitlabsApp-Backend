import Handlebars from 'handlebars';

export const defaultTemplateRuntimeOptions: Handlebars.RuntimeOptions = {
  // We trust the templates we write, so accessing proto methods/properties can be allowed.
  // See: https://handlebarsjs.com/api-reference/runtime-options.html
  allowProtoMethodsByDefault: true,
  allowProtoPropertiesByDefault: true,
};
