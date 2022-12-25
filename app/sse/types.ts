export type DataValue = {
  value: number;
};

export type Data = {
  '0'?: DataValue;
  '1'?: DataValue;
  '2'?: DataValue;
  '3'?: DataValue;
  '4'?: DataValue;
  '5'?: DataValue;
};

export type DataResults = {
  results: Data;
};

export type DataCache = {
  results: Data;
};
