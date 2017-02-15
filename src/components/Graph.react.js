import React, {Component, PropTypes} from 'react';
import Plotly from 'plotly.js';

const VALID_EVENT_KEYS = ['x', 'y', 'z', 'text', 'labels', 'values', 'pointNumber',
                          'curveNumber'];

const filterEventData = (eventData) => {
    // Create a new object
    return {
        // `Array.prototype.map` creates a new array of points.
        points: eventData.points.map((pointData) =>
            VALID_EVENT_KEYS.reduce((result, currentKey) => {
                const currentVal = pointData[currentKey];
                return Object.assign(result, {[currentKey]: currentVal});
            }, {})
        )
    };
};

export default class PlotlyGraph extends Component {
    constructor(props) {
        super(props);
        this.bindEvents = this.bindEvents.bind(this);
    }

    plot(props) {
        const {id, figure} = props;
        return Plotly.newPlot(id, figure);
    }

    bindEvents(props) {
        const {id, fireEvent, valueChanged} = props;

        // Get DOM node to call jQuery-provided `on` event binder.
        const gd = document.getElementById(id);

        gd.on('plotly_click', (eventData) => {
            const clickData = filterEventData(eventData);
            if (valueChanged) {
                valueChanged({clickData});
            }
            if (fireEvent) fireEvent({event: 'click'});
        });
        gd.on('plotly_hover', (eventData) => {
            const hoverData = filterEventData(eventData);
            if (valueChanged) valueChanged({hoverData});
            if (fireEvent) fireEvent({event: 'hover'})
        });
        gd.on('plotly_selected', (eventData) => {
            const selectedData = filterEventData(eventData);
            if (valueChanged) valueChanged({selectedData});
            if (fireEvent) fireEvent({event: 'selected'});
        });
        // TODO - Is there a zoom event?
    }

    componentDidMount() {
        this.plot(this.props).then(() => {
            this.bindEvents(this.props);
            window.addEventListener('resize', () => {
                Plotly.Plots.resize(document.getElementById(this.props.id));
            });
        });
    }

    componentWillUnmount() {
        if (this.eventEmitter) {
            this.eventEmitter.removeAllListeners();
        }
    }

    shouldComponentUpdate() {
        // Never re-render after initialization, let Plotly.js own the DOM node.
        return false;
    }

    componentWillReceiveProps(nextProps) {
        // TODO optimize this check
        const figureChanged = JSON.stringify(this.props.figure) !== JSON.stringify(nextProps.figure)

        /*
         * Rebind events in case fireEvent or valueChanged
         * wasn't defined on initial render
         * TODO - Is it safe to rebind events?
         */
        const shouldBindEvents = (
            (!this.props.valueChanged && nextProps.valueChanged) ||
            (!this.props.fireEvent && nextProps.fireEvent)
        );
        if (figureChanged) {
            this.plot(nextProps).then(() => {
                if(shouldBindEvents) this.bindEvents(nextProps);
            });
        } else if (shouldBindEvents) {
            this.bindEvents(nextProps);
        }
    }

    render(){
        const {style, id} = this.props

        return (
            <div
                id={id}
                style={style}
            />
        );
    }
}

PlotlyGraph.propTypes = {
    /**
     * Data from latest click event
     */
    clickData: PropTypes.object,

    /**
     * Data from latest hover event
     */
    hoverData: PropTypes.object,

    /**
     * Data from latest select event
     */
    selectedData: PropTypes.object,

    /**
     * Data from latest zoom event
     */
    zoomData: PropTypes.object,

    /**
     * Plotly `figure` object. See schema:
     * https://plot.ly/javascript/reference
     */
    figure: PropTypes.object,

    /**
     * Generic style overrides on the plot div
     */
    style: PropTypes.object,

    /**
     * Function that updates the state tree.
     */
    valueChanged: PropTypes.func,

    /**
     * Function that fires events
     */
    fireEvent: PropTypes.func
}

PlotlyGraph.defaultProps = {
    clickData: null,
    hoverData: null,
    selectedData: null,
    zoomData: null,
    figure: {data: [], layout: {}},
    layout: {}
};
