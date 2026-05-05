export interface Plot{
    id_plot:number;
    id_transect:number;
    code_plot:string;
    distance_plot ?: number;
    id_parent ?: number;
    sub_plots ?: Plot[]
}