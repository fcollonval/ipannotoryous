// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import expect = require('expect.js');

// import // Add any needed widget imports here (or from controls)
// '@jupyter-widgets/base';

import { createTestModel } from './utils.spec';

import { AnnotoriusModel } from '../../src/';

describe('Example', () => {
  describe('AnnotoriusModel', () => {
    it('should be createable', () => {
      let model = createTestModel(AnnotoriusModel);
      expect(model).to.be.an(AnnotoriusModel);
      expect(model.get('value')).to.be('Hello World');
    });

    it('should be createable with a value', () => {
      let state = { value: 'Foo Bar!' };
      let model = createTestModel(AnnotoriusModel, state);
      expect(model).to.be.an(AnnotoriusModel);
      expect(model.get('value')).to.be('Foo Bar!');
    });
  });
});
