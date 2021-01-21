/// <reference path="../recogito__recogito-client-core/index.d.ts"/>

declare module '@recogito/annotorious' {

  export type AnnotationEvent = 'createAnnotation' | 'deleteAnnotation' | 'selectAnnotation' | 'updateAnnotation' | 'cancelSelection' | 'createSelection' | 'changeSelectionTarget' | 'mouseEnterAnnotation' | 'mouseLeaveAnnotation';

  export interface IAuthor{
    /**
     * Should be a URI of the user ID
     */
    id: string,
    /**
     * User name to display in the UI; fallback to id
     */
    displayName?: string
  }

  export interface IFormat{
    className?: string,
    style?: string,
    [data: string]: string,
  }

  export interface IAnnotoriousConfig {
    image: HTMLImageElement | string,
    locale: string,
    readOnly?: boolean,
    headless?: boolean,
    formatter?: (annotation: IAnnotation) => string | IFormat | void,
    widgets?: any[]
  }

  export class Annotorious {

    constructor(config: IAnnotoriousConfig);

    addAnnotation(annotation: IAnnotation, readOnly?: boolean): void;

    cancelSelected(): void;

    clearAnnotations(): void;

    clearAuthInfo(): void;

    destroy(): void;

    getAnnotations(): IAnnotation[];

    getSelected(): IAnnotation;

    getSelectedImageSnippet(): any;

    loadAnnotations(url: string): IAnnotation[];

    off(event: AnnotationEvent, callback: (arg1: any, arg2?: any) => void);

    on(event: AnnotationEvent, handler: (arg1: any, arg2?: any) => void);

    removeAnnotation(annotation: IAnnotation | string): void;

    selectAnnotation(annotation: IAnnotation | string): void;

    setAnnotations(annotations: IAnnotation[]): void;

    setAuthInfo(author: IAuthor): void;

    setDrawingTool(toolName: 'rect' | 'polygon'): void;

    setVisible(visible: boolean): void;

    setServerTime(timestamp: string): void;

    updateSelected(annotation: IAnnotation, applyImmediately: boolean);
  }

  export function init(config: IAnnotoriousConfig): Annotorious;
}
