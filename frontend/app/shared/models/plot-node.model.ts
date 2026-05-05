export interface PlotNode{
    id_plot:number;
    code_plot:string;
    distance_plot?:number;
    sub_plots?:PlotNode[]
}

export interface FlatPlotNode{
    expandable:boolean;
    id_plot:number;
    code_plot:string;
    distance_plot?:number;
   level: number;
}