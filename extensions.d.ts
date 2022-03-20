declare module '*.scss' {
  const content: { readonly [className: string]: string };
  export default content;
}

interface FixedLengthArray<T extends any, L extends number> extends Array<T> {
  0: T;
  length: L;
}

interface ONNXModelMapping {
  mappings: {
    [key: string]: {
      model_name: string
      count: number
      timestamp_addi: number
    }
  }
}
