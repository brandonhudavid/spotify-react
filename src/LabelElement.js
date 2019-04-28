import React from "react";

class LabelElement extends React.Component {

    constructor(props) {
        super(props);
    }

    render() {
        return (
            <div>
                {this.props.elem}
            </div>

        )
    }
}
export default LabelElement;