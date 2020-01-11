import React from 'react';
import PropTypes from 'prop-types';
import {
  getSlideHeight,
  getAlignmentOffset
} from '../utilities/style-utilities';

const MIN_ZOOM_SCALE = 0;
const MAX_ZOOM_SCALE = 1;

export default class ScrollTransition extends React.Component {
  constructor(props) {
    super(props);

    this.getListStyles = this.getListStyles.bind(this);
  }

  getSlideDirection(start, end, isWrapping) {
    let direction = 0;
    if (start === end) return direction;

    if (isWrapping) {
      direction = start < end ? -1 : 1;
    } else {
      direction = start < end ? 1 : -1;
    }

    return direction;
  }

  /* eslint-disable complexity */
  getSlideTargetPosition(currentSlideIndex, positionValue) {
    let offset = 0;

    if (
      this.props.animation === 'zoom' &&
      (this.props.currentSlide === currentSlideIndex + 1 ||
        (this.props.currentSlide === 0 &&
          currentSlideIndex === this.props.children.length - 1))
    ) {
      offset = this.props.slideOffset;
    } else if (
      this.props.animation === 'zoom' &&
      (this.props.currentSlide === currentSlideIndex - 1 ||
        (this.props.currentSlide === this.props.children.length - 1 &&
          currentSlideIndex === 0))
    ) {
      offset = -this.props.slideOffset;
    }

    let targetPosition =
      (this.props.slideWidth + this.props.cellSpacing) * currentSlideIndex;

    const alignmentOffset = getAlignmentOffset(currentSlideIndex, this.props);
    const relativePosition = positionValue - alignmentOffset;
    const startSlideIndex = Math.min(
      Math.abs(Math.floor(relativePosition / this.props.slideWidth)),
      this.props.slideCount - 1
    );

    if (this.props.wrapAround && currentSlideIndex !== startSlideIndex) {
      const slidesOutOfView = Math.max(
        this.props.slideCount -
          Math.ceil(this.props.frameWidth / this.props.slideWidth), // Total slides in view
        0
      );

      let slidesOutOfViewBefore = Math.floor(slidesOutOfView / 2);
      let slidesOutOfViewAfter = slidesOutOfView - slidesOutOfViewBefore;

      const direction = this.getSlideDirection(
        startSlideIndex,
        this.props.currentSlide,
        this.props.isWrappingAround
      );

      if (direction < 0) {
        const temp = slidesOutOfViewBefore;
        slidesOutOfViewBefore = slidesOutOfViewAfter;
        slidesOutOfViewAfter = temp;
      }

      const slidesInViewBefore = Math.ceil(
        alignmentOffset / this.props.slideWidth
      );
      const slidesBefore = slidesInViewBefore + slidesOutOfViewBefore;

      const slidesInViewAfter =
        Math.ceil(
          (this.props.frameWidth - alignmentOffset) / this.props.slideWidth
        ) - 1;
      const slidesAfter = slidesInViewAfter + slidesOutOfViewAfter;

      const distanceFromStart = Math.abs(startSlideIndex - currentSlideIndex);
      if (currentSlideIndex < startSlideIndex) {
        if (distanceFromStart > slidesBefore) {
          targetPosition =
            (this.props.slideWidth + this.props.cellSpacing) *
            (this.props.slideCount + currentSlideIndex);
        }
      } else if (distanceFromStart > slidesAfter) {
        targetPosition =
          (this.props.slideWidth + this.props.cellSpacing) *
          (this.props.slideCount - currentSlideIndex) *
          -1;
      }
    }

    return targetPosition + offset || 0;
  }

  /* eslint-enable complexity */
  formatChildren(children) {
    const { top, left, currentSlide, slidesToShow } = this.props;
    const positionValue = this.props.vertical ? top : left;

    return React.Children.map(children, (child, index) => {
      const visible =
        index >= currentSlide && index < currentSlide + slidesToShow;

      return (
        <li
          className={`slider-slide${visible ? ' slide-visible' : ''}`}
          style={this.getSlideStyles(index, positionValue)}
          key={index}
        >
          {child}
        </li>
      );
    });
  }

  getSlideStyles(index, positionValue) {
    const targetPosition = this.getSlideTargetPosition(index, positionValue);
    const transformScale =
      this.props.animation === 'zoom' && this.props.currentSlide !== index
        ? Math.max(
            Math.min(this.props.zoomScale, MAX_ZOOM_SCALE),
            MIN_ZOOM_SCALE
          )
        : 1.0;

    return {
      boxSizing: 'border-box',
      display: this.props.vertical ? 'block' : 'inline-block',
      height: getSlideHeight(this.props),
      left: this.props.vertical ? 0 : targetPosition,
      listStyleType: 'none',
      marginBottom: this.props.vertical ? this.props.cellSpacing / 2 : 'auto',
      marginLeft: this.props.vertical ? 'auto' : this.props.cellSpacing / 2,
      marginRight: this.props.vertical ? 'auto' : this.props.cellSpacing / 2,
      marginTop: this.props.vertical ? this.props.cellSpacing / 2 : 'auto',
      MozBoxSizing: 'border-box',
      position: 'absolute',
      top: this.props.vertical ? targetPosition : 0,
      transform: `scale(${transformScale})`,
      transition: 'transform .4s linear',
      verticalAlign: 'top',
      width: this.props.vertical ? '100%' : this.props.slideWidth
    };
  }

  getListStyles(styles) {
    const { deltaX, deltaY } = styles;

    const listWidth =
      this.props.slideWidth * React.Children.count(this.props.children);
    const spacingOffset =
      this.props.cellSpacing * React.Children.count(this.props.children);
    const transform = `translate3d(${deltaX}px, ${deltaY}px, 0)`;

    return {
      transform,
      WebkitTransform: transform,
      msTransform: `translate(${deltaX}px, ${deltaY}px)`,
      position: 'relative',
      display: 'block',
      margin: this.props.vertical
        ? `${(this.props.cellSpacing / 2) * -1}px 0px`
        : `0px ${(this.props.cellSpacing / 2) * -1}px`,
      padding: 0,
      height: this.props.vertical
        ? listWidth + spacingOffset
        : this.props.slideHeight,
      width: this.props.vertical ? 'auto' : listWidth + spacingOffset,
      cursor: this.props.dragging === true ? 'pointer' : 'inherit',
      boxSizing: 'border-box',
      MozBoxSizing: 'border-box',
      touchAction: `pinch-zoom ${this.props.vertical ? 'pan-x' : 'pan-y'}`
    };
  }

  render() {
    const children = this.formatChildren(this.props.children);
    const deltaX = this.props.deltaX;
    const deltaY = this.props.deltaY;

    return (
      <ul
        className="slider-list"
        style={this.getListStyles({ deltaX, deltaY })}
      >
        {children}
      </ul>
    );
  }
}

ScrollTransition.propTypes = {
  animation: PropTypes.oneOf(['zoom']),
  cellAlign: PropTypes.string,
  cellSpacing: PropTypes.number,
  currentSlide: PropTypes.number,
  deltaX: PropTypes.number,
  deltaY: PropTypes.number,
  dragging: PropTypes.bool,
  frameWidth: PropTypes.number,
  heightMode: PropTypes.oneOf(['first', 'current', 'max']),
  isWrappingAround: PropTypes.bool,
  left: PropTypes.number,
  slideCount: PropTypes.number,
  slideHeight: PropTypes.number,
  slidesToScroll: PropTypes.number,
  slideOffset: PropTypes.number,
  slideWidth: PropTypes.number,
  top: PropTypes.number,
  vertical: PropTypes.bool,
  wrapAround: PropTypes.bool,
  zoomScale: PropTypes.number
};

ScrollTransition.defaultProps = {
  cellAlign: 'left',
  cellSpacing: 0,
  currentSlide: 0,
  deltaX: 0,
  deltaY: 0,
  dragging: false,
  frameWidth: 0,
  heightMode: 'max',
  isWrappingAround: false,
  left: 0,
  slideCount: 0,
  slideHeight: 0,
  slidesToScroll: 1,
  slideWidth: 0,
  top: 0,
  vertical: false,
  wrapAround: false,
  zoomScale: 0.85
};
