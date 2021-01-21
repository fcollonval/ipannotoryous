// Copyright (c) Frederic Collonval
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  WidgetModel,
  DOMWidgetView,
  ISerializers,
  unpack_models,
} from '@jupyter-widgets/base';
import { Annotorious, init } from '@recogito/annotorious';
import { MODULE_NAME, MODULE_VERSION } from './version';

// Import the CSS
import '../css/widget.css';

// Parent container classes in need of style tuning
//  The order is bottom to top must be respected
const PARENTS_TO_STYLE = [
  'jupyter-widgets',
  'jp-OutputArea-child',
  'jp-Cell-outputArea',
];

export class AuthorModel extends WidgetModel {
  defaults() {
    return {
      ...super.defaults(),
      _model_name: AuthorModel.model_name,
      _model_module: AuthorModel.model_module,
      _model_module_version: AuthorModel.model_module_version,
      id: '',
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
      format: 'png',
      width: '',
      height: '',
      value: new DataView(new ArrayBuffer(0)),
      author: null,
      drawingTool: 'rect',
      headless: false,
      readOnly: false,
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

  initialize(attributes: any, options: any): void {
    super.initialize(attributes, options);

    this.on('msg:custom', this.onCustomMsg.bind(this));
  }

  protected onCustomMsg(content: any, buffers: any[]): void {
    const action = content.action as string;
    switch (action) {
      case 'delete':
        this._forEachView((view: AnnotoriusView) => {
          view.deleteAnnotation(content.annotation);
        });
        break;
      case 'update':
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
}

export class AnnotoriusView extends DOMWidgetView {
  render() {
    this.el.classList.add('annotorius-widget');
    this._img = document.createElement<'img'>('img');
    this.el.append(this._img);
    this._annotator = init({
      image: this._img,
      locale: 'auto',
      readOnly: this.model.get('readOnly'),
      headless: this.model.get('headless'),
      formatter: AnnotoriusView._formatAnnotation,
    });
    // TODO sync annotations
    // this._annotator.addAnnotation({
    //   '@context': 'http://www.w3.org/ns/anno.jsonld',
    //   id: '#a88b22d0-6106-4872-9435-c78b5e89fede',
    //   type: 'Annotation',
    //   body: [
    //     {
    //       type: 'TextualBody',
    //       value: "It's Hallstatt in Upper Austria",
    //     },
    //   ],
    //   target: {
    //     selector: {
    //       type: 'FragmentSelector',
    //       conformsTo: 'http://www.w3.org/TR/media-frags/',
    //       value: 'xywh=pixel:5,5,25,25',
    //     },
    //   },
    // });

    // Tune notebook elements to display editor properly
    this.displayed.then(() => {
      this._updateParentOverflowStyle('visible');
    });
    // Connect Python event
    this.model.on('change:value', this.valueChanged, this);
    this.model.on('change:author', this.authorChanged, this);
    this.model.on('change:drawingTool', this.drawingToolChanged, this);

    // Connect JavaScript event
    this._annotator.on('createAnnotation', this.handleCreate.bind(this));
    this._annotator.on('updateAnnotation', this.handleUpdate.bind(this));
    this._annotator.on('deleteAnnotation', this.handleDelete.bind(this));

    // Propagate initial value
    this.valueChanged();
    this.authorChanged();
    this.drawingToolChanged();
  }

  remove(): void {
    // Clear style customization
    this._updateParentOverflowStyle();

    if (this._annotator) {
      this._annotator.destroy();
    }

    if (this._img.src) {
      URL.revokeObjectURL(this._img.src);
    }

    super.remove();
  }

  updateAnnotation(annotation: any) {
    if (this._annotator) {
      this._annotator.addAnnotation(annotation);
    }
  }

  deleteAnnotation(annotation: any) {
    if (this._annotator) {
      this._annotator.removeAnnotation(annotation);
    }
  }

  protected handleCreate(annotation: any): void {
    this.send({ event: 'onCreateAnnotation', args: { annotation } });
  }

  protected handleDelete(annotation: any): void {
    this.send({ event: 'onDeleteAnnotation', args: { annotation } });
  }

  protected handleUpdate(annotation: any): void {
    this.send({ event: 'onUpdateAnnotation', args: { annotation } });
  }

  protected authorChanged(): void {
    if (this._annotator) {
      const author = this.model.get('author');
      if (author) {
        this._annotator.setAuthInfo({
          id: author.get('id'),
          displayName: author.get('displayName'),
        });
      } else {
        this._annotator.clearAuthInfo();
      }
    }
  }

  protected drawingToolChanged(): void {
    if (this._annotator) {
      this._annotator.setDrawingTool(this.model.get('drawingTool'));
    }
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
