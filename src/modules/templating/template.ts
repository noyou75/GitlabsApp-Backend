export abstract class Template {
  abstract render(parameters?: { [k: string]: any }): Promise<string>;
}
