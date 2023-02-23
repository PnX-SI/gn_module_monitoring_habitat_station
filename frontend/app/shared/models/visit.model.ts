export interface IVisit {
  id_base_site?: string;
  id_base_visit?: string;
  visit_date_min?: string;
  observers?: any[];
  cor_visit_perturbation?: any[];
  perturbations?: any[];
  cor_releve_plot?: Plot[];
}

export interface Plot {
  code_plot?: string;
  id_plot?: number;
  plot_data?: PlotData;
  status?: boolean;
}

export interface PlotData {
  excretes_presence?: boolean;
  taxons_releve?: any[];
  strates_releve?: any[];
}
