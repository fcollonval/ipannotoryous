// Copyright (c) ARIADNEXT
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
  unpack_models,
  WidgetModel,
} from '@jupyter-widgets/base';
import { Annotorious, init, ISnippet } from '@recogito/annotorious';
// Import the CSS
import '../css/widget.css';
import { toBytes } from './utils';
import { MODULE_NAME, MODULE_VERSION } from './version';

// Parent container classes in need of style tuning
//  The order is bottom to top must be respected
const PARENTS_TO_STYLE = [
  'jp-OutputArea-output',
  'jp-OutputArea-child',
  'jp-Cell-outputArea',
];

/**
 * Widget annotation's author model
 */
export class AuthorModel extends WidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: AuthorModel.model_name,
      _model_module: AuthorModel.model_module,
      _model_module_version: AuthorModel.model_module_version,
      /**
       * Author unique identifier - should be an URI
       */
      id: '',
      /**
       * Displayed name in the widget
       */
      displayName: '',
    };
  }

  static model_name = 'AuthorModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = null;
  static view_module = null;
  static view_module_version = MODULE_VERSION;
}

/**
 * Widget Annotorius model
 */
export class AnnotoriusModel extends DOMWidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: AnnotoriusModel.model_name,
      _model_module: AnnotoriusModel.model_module,
      _model_module_version: AnnotoriusModel.model_module_version,
      _view_name: AnnotoriusModel.view_name,
      _view_module: AnnotoriusModel.view_module,
      _view_module_version: AnnotoriusModel.view_module_version,
      /**
       * Image format
       */
      format: 'png',
      /**
       * Image width
       */
      width: '',
      /**
       * Image height
       */
      height: '',
      /**
       * Image as bytes array
       */
      value: new DataView(new ArrayBuffer(0)),
      /**
       * Annotation author information
       */
      author: null,
      /**
       * Default tags
       */
      default_tags: [],
      /**
       * Drawing tool
       */
      drawingTool: 'rect',
      /**
       * Whether annotation tool is headless
       */
      headless: false,
      /**
       * Whether annotation are readonly in the frontend
       */
      readOnly: false,
      /**
       * Annotation content template
       */
      template: [],
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    value: {
      serialize: (value: any): DataView => {
        return new DataView(value.buffer.slice(0));
      },
    },
    author: { deserialize: unpack_models as any },
  };

  static model_name = 'AnnotoriusModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'AnnotoriusView';
  static view_module = MODULE_NAME;
  static view_module_version = MODULE_VERSION;

  /**
   * Annotations list.
   */
  get annotations(): any[] {
    return this._annotations;
  }

  /**
   * Model initialization
   *
   * @param attributes
   * @param options
   */
  initialize(attributes: any, options: any): void {
    super.initialize(attributes, options);

    this.on('msg:custom', this.onCustomMsg, this);

    this.send({ event: 'onModelIsReady' }, {});
  }

  /**
   * Callback on custom message.
   *
   * @param content Message content
   * @param buffers Message buffers
   */
  protected onCustomMsg(content: any, buffers: any[]): void {
    const action = content.action as string;
    // For deletion, the annotation can be specified only by its id.
    const index = this._annotations.findIndex(
      (annotation) =>
        annotation.id ===
        (content.annotation?.id ? content.annotation.id : content.annotation)
    );
    switch (action) {
      case 'delete':
        if (index >= 0) {
          const removedAnnotations = this._annotations.splice(index, 1);
          this._forEachView((view: AnnotoriusView) => {
            view.deleteAnnotation(removedAnnotations[0]);
          });
        }
        break;
      case 'image_snippet':
        ((views) => {
          const viewIDs = Object.keys(views);
          if (viewIDs.length > 0) {
            // Extract image snippet from the first view
            (views[viewIDs[0]] as Promise<AnnotoriusView>)
              .then((view: AnnotoriusView) => {
                if (index >= 0) {
                  // Check the current selected annotation
                  const currentAnnotation = view.selectedAnnotation?.id;
                  if (this._annotations[index] !== currentAnnotation) {
                    view.selectAnnotation(this._annotations[index]);
                  }
                }
                // Extract image snippet
                const snippet = view.selectedImageSnippet;
                if (snippet) {
                  return toBytes(snippet.snippet);
                } else {
                  return Promise.resolve(null);
                }
              })
              .then((dataView) => {
                // Send image snippet through buffer
                this.send(
                  {
                    event: 'imageSnippet',
                    uid: content.uid,
                  },
                  {},
                  dataView ? [dataView.buffer] : undefined
                );
              })
              .catch((reason) => {
                console.error('Fail to get selected image snippet.', reason);
              });
          }
        })(this.views);
        break;
      case 'update':
        if (index >= 0) {
          this._annotations[index] = { ...content.annotation };
        } else {
          this._annotations.push(content.annotation);
        }
        this._forEachView((view: AnnotoriusView) => {
          view.updateAnnotation(content.annotation);
        });
        break;
    }
  }

  private _forEachView(callback: (view: AnnotoriusView) => void) {
    const views = this.views as { [k: string]: Promise<AnnotoriusView> };
    for (const view_id in views) {
      views[view_id].then((view: AnnotoriusView) => {
        callback(view);
      });
    }
  }

  private _annotations: any[] = [];
}

/**
 * Widget Annotorius view
 */
export class AnnotoriusView extends DOMWidgetView {
  /**
   * Currently selected annotation
   */
  get selectedAnnotation(): any {
    return this._annotator?.getSelected();
  }

  /**
   * Image snippet from the currently selected annotation
   */
  get selectedImageSnippet(): ISnippet | undefined {
    return this._annotator?.getSelectedImageSnippet();
  }

  render(): void {
    this.pWidget.addClass('annotorius-widget');
    this._img = document.createElement<'img'>('img');
    this.el.append(this._img);
    this._annotator = init({
      image: this._img,
      locale: 'auto',
      readOnly: this.model.get('readOnly'),
      headless: this.model.get('headless'),
      formatter: AnnotoriusView._formatAnnotation,
      widgets: [
        'COMMENT',
        { widget: 'TAG', vocabulary: this.model.get('default_tags') },
      ],
    });

    // Tune notebook elements to display editor properly
    this.displayed.then(() => {
      this._updateParentOverflowStyle('visible');
    });
    // Connect Python event
    // FIXME is it a good idea to let user change dynamically the image and/or its size
    this.model.on(
      {
        'change:value': this.valueChanged,
        'change:format': this.valueChanged,
        'change:height': this.valueChanged,
        'change:width': this.valueChanged,
        'change:author': this.authorChanged,
        'change:drawingTool': this.drawingToolChanged,
      },
      this
    );

    // Connect JavaScript event
    this._annotator.on('createAnnotation', this.handleCreate.bind(this));
    this._annotator.on('deleteAnnotation', this.handleDelete.bind(this));
    this._annotator.on('selectAnnotation', this.handleSelect.bind(this));
    this._annotator.on('updateAnnotation', this.handleUpdate.bind(this));
    this._annotator.on(
      'createSelection',
      this.handleCreateSelection.bind(this)
    );

    // Propagate initial value
    this.valueChanged();
    this.authorChanged();
    this.drawingToolChanged();

    (this.model as AnnotoriusModel).annotations.forEach((annotation) => {
      this.updateAnnotation(annotation);
    });
  }

  /**
   * Remove the view
   */
  remove(): void {
    // Clear style customization
    this._updateParentOverflowStyle();

    if (this._annotator) {
      this._annotator.off('createAnnotation', this.handleCreate.bind(this));
      this._annotator.off('deleteAnnotation', this.handleDelete.bind(this));
      this._annotator.off('selectAnnotation', this.handleSelect.bind(this));
      this._annotator.off('updateAnnotation', this.handleUpdate.bind(this));
      this._annotator.off(
        'createSelection',
        this.handleCreateSelection.bind(this)
      );
      this._annotator.destroy();
    }

    this.model.off(undefined, undefined, this);

    if (this._img.src) {
      URL.revokeObjectURL(this._img.src);
    }

    super.remove();
  }

  /**
   * Select an annotation
   *
   * @param annotation Annotation object to be selected
   */
  selectAnnotation(annotation: any): void {
    this._annotator?.selectAnnotation(annotation);
  }

  /**
   * Update an annotation
   *
   * @param annotation Annotation object to be updated
   */
  updateAnnotation(annotation: any): void {
    this._annotator.addAnnotation(annotation);
  }

  /**
   * Delete an annotation
   *
   * @param annotation Annotation object and id to be deleted
   */
  deleteAnnotation(annotation: any): void {
    this._annotator.removeAnnotation(annotation);
  }

  protected handleCreate(annotation: any): void {
    this.send({ event: 'onCreateAnnotation', args: { annotation } });
  }

  protected handleCreateSelection(selection: any): void {
    const template = this.model.get('template');
    if (template.length > 0) {
      selection.body = template;
      this._annotator?.updateSelected(selection, true);
    }
  }

  protected handleDelete(annotation: any): void {
    this.send({ event: 'onDeleteAnnotation', args: { annotation } });
  }

  protected handleSelect(annotation: any): void {
    this.send({ event: 'onSelectAnnotation', args: { annotation } });
  }

  protected handleUpdate(annotation: any, previous: any): void {
    this.send({ event: 'onUpdateAnnotation', args: { annotation, previous } });
  }

  protected authorChanged(): void {
    const author = this.model.get('author');
    if (author) {
      this._annotator?.setAuthInfo({
        id: author.get('id'),
        displayName: author.get('displayName'),
      });
    } else {
      this._annotator?.clearAuthInfo();
    }
  }

  protected drawingToolChanged(): void {
    this._annotator?.setDrawingTool(this.model.get('drawingTool'));
  }

  protected valueChanged(): void {
    let url;
    const format = this.model.get('format');
    const value = this.model.get('value');
    if (format !== 'url') {
      const blob = new Blob([value], {
        type: `image/${this.model.get('format')}`,
      });
      url = URL.createObjectURL(blob);
    } else {
      url = new TextDecoder('utf-8').decode(value.buffer);
    }

    // Clean up the old objectURL
    const oldurl = this._img.src;
    this._img.src = url;
    if (oldurl && typeof oldurl !== 'string') {
      URL.revokeObjectURL(oldurl);
    }

    const height = this.model.get('height');
    if (height !== undefined && height.length > 0) {
      this._img.setAttribute('height', height);
    } else {
      this._img.removeAttribute('height');
    }

    const width = this.model.get('width');
    if (width !== undefined && width.length > 0) {
      this._img.setAttribute('width', width);
    } else {
      this._img.removeAttribute('width');
    }
  }

  /**
   * Add data-tags with the annotation tags to the annotation DOM node
   *
   * @param annotation Annotation to be formatted
   * @returns Annotation format object
   */
  private static _formatAnnotation(annotation: any) {
    const tags: string[] = annotation.body
      .filter((el: any) => el.purpose === 'tagging')
      .map((el: any) => el.value);

    if (tags.length > 0) {
      return { 'data-tags': tags.join(',') };
    }
  }

  /**
   * Parent container of the widget are blocking the display of the
   * editor as it overflows.
   *
   * This is a bit of plumbing to change style on some parents to allow
   * overflow on that specific output cell.
   */
  private _updateParentOverflowStyle(value = ''): void {
    // FIXME this does not work when the widget is encapsulated in Boxes widgets
    let parent: HTMLElement | null = this.el as HTMLElement;
    PARENTS_TO_STYLE.forEach((className) => {
      while (parent) {
        parent = parent.parentElement;

        if (parent?.classList.contains(className)) {
          parent.style.overflow = value;
          break;
        }
      }
    });
  }

  private _annotator: Annotorious;
  private _img: HTMLImageElement;
}
