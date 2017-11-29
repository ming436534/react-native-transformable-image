'use strict';

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Image } from 'react-native';

import ViewTransformer from 'react-native-view-transformer';

let DEV = false;

export default class TransformableImage extends Component {

  static enableDebug() {
    DEV = true;
  }

  static propTypes = {
    pixels: PropTypes.shape({
      width: PropTypes.number,
      height: PropTypes.number,
    }),

    enableTransform: PropTypes.bool,
    enableScale: PropTypes.bool,
    enableTranslate: PropTypes.bool,
    onSingleTapConfirmed: PropTypes.func,
    onTransformGestureReleased: PropTypes.func,
    onViewTransformed: PropTypes.func
  };

  static defaultProps = {
    enableTransform: true,
    enableScale: true,
    enableTranslate: true
  };

  constructor(props) {
    super(props);

    this.state = {
      width: 0,
      height: 0,

      imageLoaded: false,
      pixels: undefined,
      keyAcumulator: 1
    };
  }

  componentWillMount() {
  }

  componentWillReceiveProps(nextProps) {
    if (!sameSource(this.props.source, nextProps.source)) {
      //image source changed, clear last image's pixels info if any
      this.setState({pixels: undefined, keyAcumulator: this.state.keyAcumulator + 1})
    }
  }

  render() {
    let maxScale = this.props.maxScale;
    let contentAspectRatio = undefined;
    let width, height; //pixels

    if (this.props.pixels) {
      //if provided via props
      width = this.props.pixels.width;
      height = this.props.pixels.height;
    } else if (this.state.pixels) {
      //if got using Image.getSize()
      width = this.state.pixels.width;
      height = this.state.pixels.height;
    }

    if (width && height) {
      contentAspectRatio = width / height;
      if (this.state.width && this.state.height) {
        maxScale = Math.max(width / this.state.width, height / this.state.height);
        maxScale = Math.max(1, maxScale);
      }
    }


    return (
      <ViewTransformer
        ref='viewTransformer'
        key={'viewTransformer#' + this.state.keyAccumulator} //when image source changes, we should use a different node to avoid reusing previous transform state
        enableTransform={this.props.enableTransform && this.state.imageLoaded} //disable transform until image is loaded
        enableScale={this.props.enableScale}
        enableTranslate={this.props.enableTranslate}
        enableResistance={true}
        onTransformGestureReleased={this.props.onTransformGestureReleased}
        onViewTransformed={this.props.onViewTransformed}
        onSingleTapConfirmed={this.props.onSingleTapConfirmed}
        maxScale={maxScale}
        contentAspectRatio={null}
        onLayout={this.onLayout}
        onExceed={this.props.onExceed}
        exceedThreshold={this.props.exceedThreshold}
        style={this.props.style}>
        <Image
          {...this.props}
          style={[this.props.style, {backgroundColor: 'transparent'}]}
          resizeMode={'contain'}
          onLoadStart={this.onLoadStart}
          onLoad={this.onLoad}
          capInsets={{left: 0.1, top: 0.1, right: 0.1, bottom: 0.1}} //on iOS, use capInsets to avoid image downsampling
        />
      </ViewTransformer>
    );
  }

  onLoadStart = (e) => {
    this.props.onLoadStart && this.props.onLoadStart(e);
    this.setState({
      imageLoaded: false
    });
  }

  onLoad = (e) => {
    this.props.onLoad && this.props.onLoad(e);
    this.setState({
      imageLoaded: true
    });
  }

  onLayout = (e) => {
    let {width, height} = e.nativeEvent.layout;
    if (this.state.width !== width || this.state.height !== height) {
      this.setState({
        width: width,
        height: height
      });
    }
  }

  getViewTransformerInstance() {
    return this.refs['viewTransformer'];
  }
}

function sameSource(source, nextSource) {
  if (source === nextSource) {
    return true;
  }
  if (source && nextSource) {
    if (source.uri && nextSource.uri) {
      return source.uri === nextSource.uri;
    }
  }
  return false;
}
