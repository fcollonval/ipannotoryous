declare module '@recogito/recogito-client-core' {
  export interface IAnnotation {
    '@context': string;
    type: string;
    id: string;
    body: any[];
  }

  export interface IWebAnnotationOptions {
    readOnly?: boolean
  }

  export class WebAnnotation {
    constructor(annotation: IAnnotation, options?: IWebAnnotationOptions);

    static create(args: any): WebAnnotation;

    readonly readOnly: boolean;

    readonly id: string;

    readonly type: string;

    readonly motivation: any;

    readonly body: any[];

    readonly target: any[];

    bodies: any[];

    targets: any[];

    selector: (type: any) => any;

    readonly quote: any;

    readonly start: any;

    readonly end: any;
  }
}
