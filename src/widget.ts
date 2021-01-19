// Copyright (c) Frederic Collonval
// Distributed under the terms of the Modified BSD License.

import {
  DOMWidgetModel,
  DOMWidgetView,
  ISerializers,
} from '@jupyter-widgets/base';
import { init } from '@recogito/annotorious';

// import './annotorious.min.css';
// import '@recogito/annotorious/dist/annotations.min.css';

import { MODULE_NAME, MODULE_VERSION } from './version';

// Import the CSS
import '../css/widget.css';

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
      author: {},
      drawingTool: 'rect',
    };
  }

  static serializers: ISerializers = {
    ...DOMWidgetModel.serializers,
    value: {
      serialize: (value: any): DataView => {
        return new DataView(value.buffer.slice(0));
      },
    },
  };

  static model_name = 'AnnotoriusModel';
  static model_module = MODULE_NAME;
  static model_module_version = MODULE_VERSION;
  static view_name = 'AnnotoriusView'; // Set to null if no view
  static view_module = MODULE_NAME; // Set to null if no view
  static view_module_version = MODULE_VERSION;
}

export class AnnotoriusView extends DOMWidgetView {
  render() {
    this.el.classList.add('annotorius-widget');
    this._img = document.createElement<'img'>('img');
    this.el.append(this._img);
    this._annotator = init({
      image: this._img,
      // headless: true,
      locale: 'auto',
      // formatter: () => {
      //   return { style: 'stroke: red' };
      // },
    });
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

    this.valueChanged();
    this.model.on('change:drawingTool', this.drawingToolChanged, this);
    this.model.on('change:value', this.valueChanged, this);
  }

  remove(): void {
    if (this._annotator) {
      this._annotator.destroy();
    }
    if (this._img.src) {
      URL.revokeObjectURL(this._img.src);
    }
    super.remove();
  }

  drawingToolChanged(): void {
    if (this._annotator) {
      this._annotator.setDrawingTool(this.model.get('drawingTool'));
    }
  }

  valueChanged(): void {
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

  private _annotator: any;
  private _img: HTMLImageElement;
}
