import { ReactElement, ReactNode } from "react";
import { SelectItem } from "../../../Select/Select";
import { UploadTask } from "firebase/storage";
import { UnresolvableOr } from "../../../../type-utils";

export type GenericFormFieldProps<T extends FormField["type"]> = {
  value: AnswerByField<{ type: T }>;
  onAnswer: (FormFieldProps<{ type: T }> & {
    mode: FormMode.WRITE;
  })["onAnswer"];
  question: FormFieldView & { type: T };
  error?: string;
};

export type FormFieldProps<Q extends Pick<FormFieldView, "type">> = {
  config: Q;
  value: AnswerByField<Q>;
} & (
  | {
      mode: FormMode.READ_ONLY;
    }
  | {
      mode?: FormMode.WRITE;
      onAnswer: <T extends Q["type"]>(
        questionType: T,
        questionId: string,
        answer:
          | AnswerAction<{
              type: T;
            }>
          | undefined
      ) => void;
      error?: string | string[];
    }
);

export enum FormMode {
  READ_ONLY,
  WRITE,
}
export type FormFieldView = FormField & {
  title: string;
};

export type AnswerAction<F extends Pick<FormField, "type">> =
  F["type"] extends "file" ? File : AnswerByField<F>;

export type BasicFormFields =
  | {
      type: "select";
      filter?: (item: SelectItem, term: string) => boolean;
      options: SelectItem[];
    }
  | {
      type: "text";
      multiline?: number;
    }
  | {
      type: "number";
    };

type DistributeValidatorOverUnion<FormFieldTypes extends { type: any }> =
  FormFieldTypes extends any
    ? FormFieldTypes & {
        validator?: (
          val: AnswerAction<FormFieldTypes> | undefined
        ) => boolean | string;
      }
    : never;
export type FormField = {
  optional?: boolean;
  id: string;
} & DistributeValidatorOverUnion<
  | BasicFormFields
  | {
      type: "radio";
      options: SelectItem[];
    }
  | {
      type: "check" | "rawcheck";
      options: SelectItem[];
    }
  | {
      type: "file";
      fileUsageDescription: string;
      extensions: string[];
      footer: string;
      openFile?: {
        action: () => void;
        label: string | ReactNode;
      };
    }
  | {
      type: "accept";
      link: {
        type: "file" | "route";
        to: string;
      };
      contract: {
        action: () => void;
        label: string | ReactNode;
      };
      accept: {
        label: string;
        optional?: true;
      }[];
    }
  | UnresolvableOr<OnepercentUtility.UIElements.FormExtension["fields"], {}>
>;

type ExternalQuestionFields = UnresolvableOr<
  OnepercentUtility.UIElements.FormExtension["fieldAnswer"],
  {}
>;

export type AnswerByField<F extends Pick<FormField, "type">> =
  F["type"] extends "file"
    ? UploadTask | true
    : F["type"] extends "accept" | "check" | "rawcheck"
    ? boolean[]
    : F["type"] extends "radio" | "text" | "select" | "number"
    ? string
    : F["type"] extends keyof ExternalQuestionFields
    ? OnepercentUtility.UIElements.FormExtension["fieldAnswer"][F["type"]]
    : unknown;

type O = FormField["type"];
type TestAnswerByField = [
  AnswerByField<{ type: "number" }>,
  AnswerByField<{ type: "check" }>,
  AnswerByField<{ type: "rawcheck" }>,
  AnswerByField<{ type: "file" }>,
  AnswerByField<{ type: "accept" }>,
  AnswerByField<{ type: "radio" }>,
  AnswerByField<{ type: "text" }>,
  AnswerByField<{ type: "select" }>,
  AnswerByField<{ type: "phone" }>,
  AnswerByField<{ type: "date" }>,
  AnswerByField<{ type: O }>
];
