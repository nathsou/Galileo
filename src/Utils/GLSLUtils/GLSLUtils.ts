
export type GLSLFunction = (name?: string) => string;

export function snake_casify(camel_case: string): string {
    return camel_case.split(/(?=[A-Z])/).join('_');
}

export function preprocessor_isolate(name: string, code: string): string {
    name = snake_casify(name).toUpperCase();

    return `
        #ifndef ${name}
            #define ${name}
            ${code}
        #endif
    `;
}
