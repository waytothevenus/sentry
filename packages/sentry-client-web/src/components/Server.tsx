import * as React from "react";

import { IServer } from "../reducer";

import Status from "./Status";
import Bar from "./Bar";
import { EStatus } from "../constants";

import { formatBytes } from "../lib/utils";

import { pretty } from "../utils/prettyTime";

interface IStateProps {
    data: IServer;
    index: number;
    expanded?: boolean;
}

interface IDispatchProps {
    removeServer?: () => any;
}

export class Server extends React.Component<IStateProps & IDispatchProps, any> {
    constructor(props: any) {
        super(props);
        this.state = {
            expanded: false,
            hover: false
        };
    }

    // Handlers
    public handleClick() {
        this.toggleExpand();
    }

    public handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
        switch (e.key) {
            case "Enter":
                this.toggleExpand();
                break;
        }
    }

    public handleOnMouseEnter() {
        this.setState({
            hover: true
        });
    }

    public handleOnMouseLeave() {
        this.setState({
            hover: false
        });
    }

    public toggleExpand() {
        this.setState({
            expanded: !this.state.expanded
        });
    }

    public getStyle(): React.CSSProperties {
        return {
            width: "280px",
            padding: "5px 10px",
            borderBottom: "1px solid #adb0af"
        };
    }

    // Helper function to render a flex row with left/right spans
    public renderRow(label: string, data: string) {
        return (
            <div style={{ display: "flex", justifyContent: "space-between", height: "20px" }}>
                <strong>{label}</strong>
                <span>{data}</span>
            </div>
        );
    }

    // Render
    public renderStatus(): JSX.Element {
        const status = this.props.data.status ? this.props.data.status : EStatus.unknown;
        return (
            <Status status={status} />
        );
    }

    public renderData(): JSX.Element | null {
        // const staticInfo = this.props.data.staticInfo;

        if (!this.props.data.dynamicInfo) {
            return null;
        }

        const dynamicInfo = this.props.data.dynamicInfo;

        const cpuModel = dynamicInfo.cpus[0].model.split("@")[0];
        // const cpuSpeed = dynamicInfo.cpus[0].model.split("@")[1];

        function renderCpuCores() {

            function getCpuContainerStyle(): React.CSSProperties {
                return {
                    width: "100%",
                    height: "20px",
                    padding: "1px"
                };
            }

            const bars = dynamicInfo.cpus.map((core: any, index: number) => {

                // Calulate total by summing up all the times
                let total = 0;
                for (const type in core.times) {
                    total += core.times[type];
                }

                // Calculate our used and percent
                const used = core.times.user + core.times.sys;
                const percent = (used * 100) / total;

                return (
                    <div style={getCpuContainerStyle()}>
                        <Bar
                            key={index}
                            style={{ width: "100%" }}
                            percentage={percent}
                            text={`${percent.toFixed(2)}%`} />
                    </div>
                );
            });

            return (
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                    {bars}
                </div>
            );
        }

        return (
            <div style={{ marginTop: "0.5em" }}>
                {this.renderRow("hostname:", dynamicInfo.hostname)}
                {this.renderRow("host:", this.props.data.host)}
                {this.renderRow("uptime:", pretty(dynamicInfo.uptime, 2))}
                {this.renderRow("cpu:", cpuModel)}
                {renderCpuCores()}
                {this.renderRow("ram:", "")}
                <Bar
                    percentage={(dynamicInfo.freemem / dynamicInfo.totalmem) * 100}
                    text={`${formatBytes(dynamicInfo.freemem)} / ${formatBytes(dynamicInfo.totalmem)}`} />
            </div>
        );
    }

    public renderServiceData(): JSX.Element | null {

        function getServiceDataStyle(): React.CSSProperties {
            return {
                marginTop: "0.5em"
            };
        }

        const services = this.props.data.serviceInfo;

        if (!services) {
            return null;
        }

        const serviceKeys = Object.keys(services);

        return (
            <div style={getServiceDataStyle()}>
                {this.renderRow("services:", serviceKeys.length.toString())}
                {serviceKeys.map((key, index) => {
                    const status = services[key].status ? EStatus.available : EStatus.outage;
                    return (
                        <div
                            key={index}
                            style={{ height: "20px" }}>
                            <Status status={status} />
                            {services[key].name}
                        </div>
                    );
                })}
            </div>
        );
    }

    public renderDetails(): JSX.Element {
        function getDetailStyle() {
            return {
                fontSize: "14px",
                marginBottom: "10px"
            };
        }

        return (
            <div style={getDetailStyle()}>
                {this.renderData()}
                {this.renderServiceData()}
            </div>
        );
    }

    public renderChevron(): JSX.Element {
        const style = {
            marginLeft: "10px",
            float: "right",
            cursor: "pointer"
        };

        const className = this.state.expanded ? "fa fa-chevron-down" : "fa fa-chevron-right";

        return (
            <i
                onClick={() => this.handleClick()}
                style={style}
                className={className}></i>
        );
    }

    public render(): JSX.Element {
        return (
            <div
                tabIndex={0}
                onFocus={() => this.handleOnMouseEnter()}
                onBlur={() => this.handleOnMouseLeave()}
                onMouseEnter={() => this.handleOnMouseEnter()}
                onMouseLeave={() => this.handleOnMouseLeave()}
                onKeyDown={(e) => this.handleKeyDown(e)}
                style={this.getStyle()}>
                <div>
                    <span>
                        {this.renderStatus()}
                        {this.props.data.name}
                    </span>
                    {this.state.hover ? this.renderChevron() : null}
                </div>
                {this.state.expanded ? this.renderDetails() : null}
            </div>
        );
    }
}

export default Server;
