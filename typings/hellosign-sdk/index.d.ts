declare module 'hellosign-sdk' {
  // Configuration
  type Configuration =
    | { key: string }
    | { username: string; password: string }
    | {
        key: string;
        client_id: string;
        client_secret: string;
      };

  function Hellosign(options: Configuration): Hellosign.Api;

  namespace Hellosign {
    export type Flag = 0 | 1;

    // Api response base
    interface BasicResponse {
      warnings: any;
      statusCode: number;
      statusMessage: string;
    }

    // Account Api
    export namespace Account {
      export interface Account {
        account_id: string;
        email_address: string;
        callback_url: string;
        is_locked: boolean;
        is_paid_hs: boolean;
        is_paid_hf: boolean;
        quotas: {
          api_signature_requests_left: number;
          documents_left: number;
          templates_left: number;
        };
        role_code: string;
      }

      export type AccountResponse = BasicResponse & {
        account: Account;
      };

      export interface Api {
        get: () => Promise<AccountResponse>;
        update: (payload: { callback_url: string }) => Promise<AccountResponse>;
        create: (payload: { email_address: string }) => Promise<AccountResponse>;
        verify: (payload: { email_address: string }) => Promise<AccountResponse>;
      }
    }

    // Signature Request Api
    export namespace SignatureRequest {
      export interface SignatureRequest {
        test_mode: Flag;
        signature_request_id: string;
        requester_email_address: string;
        title: string;
        subject: string;
        message: string;
        is_complete: boolean;
        is_declined: boolean;
        has_error: boolean;
        files_url: string;
        signing_url: string;
        details_url: string;
        cc_email_addresses: Array<string>;
        signing_redirect_url: string;
        custom_fields: Array<{
          name: string;
          type: FieldType;
          value: string;
          required: boolean;
          editor: string;
        }>;
        response_data: Array<{
          api_id: string;
          signature_id: string;
          name: string;
          value: boolean;
          required: boolean;
          type: string;
        }>;
        metadata?: { [key: string]: string };
        signatures: Array<Signature>;
      }

      export type SignatureStatusCode = 'awaiting_signature' | 'signed' | 'declined';

      export interface Signature {
        signature_id: string;
        signer_email_address: string;
        signer_name: string;
        signer_role: string;
        order: number;
        status_code: SignatureStatusCode;
        decline_reason: string;
        signed_at: number;
        last_viewed_at: number;
        last_reminded_at: number;
        has_pin: boolean;
        reassigned_by: string;
        reassignment_reason: string;
        error: string;
      }

      export interface ListOptions {
        page?: number;
        page_size?: number;
      }

      export type ListResponse = BasicResponse & {
        list_info: {
          page: number;
          num_pages: number;
          num_results: number;
          page_size: number;
        };
        signature_requests: Array<SignatureRequest>;
      };

      export type SignatureRequestResponse = BasicResponse & {
        signature_request: SignatureRequest;
      };

      export type FieldType =
        | 'text'
        | 'checkbox'
        | 'date_signed'
        | 'executiondate'
        | 'initials'
        | 'signature'
        | 'text-merge'
        | 'checkbox-merge';

      export type ValidationTypeBase =
        | 'numbers_only'
        | 'letters_only'
        | 'phone_number'
        | 'bank_routing_number'
        | 'bank_account_number'
        | 'email_address'
        | 'zip_code'
        | 'social_security_number'
        | 'employer_identification_number';

      export type ValidationTypeRegex = 'custom_regex';

      export type ValidationType = ValidationTypeBase | ValidationTypeRegex;

      export interface DocumentFieldBaseValidation {
        api_id: string;
        name: string;
        type: FieldType;
        x: number;
        y: number;
        width: number;
        height: number;
        required?: boolean;
        signer: number | string;
        page?: number;
        validation_type?: ValidationTypeBase;
      }

      export type DocumentFieldRegexpValidation = DocumentFieldBaseValidation & {
        validation_type: 'custom_regex';
        validation_custom_regex: string;
        validation_custom_regex_format_label: string;
      };

      export type DocumentField = DocumentFieldBaseValidation | DocumentFieldRegexpValidation;

      export interface SigningOptions {
        draw: boolean;
        type: boolean;
        upload: boolean;
        phone: boolean;
        default: boolean;
      }

      export interface Payload {
        test_mode?: Flag;
        clientId: string;
        title?: string;
        subject?: string;
        message?: string;
        signers?: Array<{
          email_address: string;
          name: string;
          role: string;
          order?: number;
        }>;
        ccs?: Array<{
          email_address: string;
          role: string;
        }>;
        custom_fields?: Array<{
          name: string;
          value: string;
          editor?: string;
          required?: boolean;
        }>;
        cc_email_addresses?: Array<string>;
        metadata?: { [key: string]: string };
        allow_decline?: Flag;
        signing_options?: SigningOptions;
      }

      export type TemplatePayload = Payload & {
        template_id: string;
      };

      export type FilePayload = Payload & {
        files: Array<string>;
        use_text_tags?: Flag;
        hide_text_tags?: Flag;
        allow_reassign?: Flag;
        form_fields_per_document?: Array<Array<DocumentField>>;
      };

      export interface Api {
        get: (id: string) => Promise<SignatureRequestResponse>;
        list: (options?: ListOptions) => Promise<ListResponse>;
        send: (data: FilePayload) => Promise<SignatureRequestResponse>;
        sendWithTemplate: (data: TemplatePayload) => Promise<SignatureRequestResponse>;
        createEmbeddedWithTemplate: (data: TemplatePayload) => Promise<SignatureRequestResponse>;
        createEmbedded: (data: FilePayload) => Promise<SignatureRequestResponse>;
        remind: (request_id: string, options: { email_address: string }) => Promise<SignatureRequestResponse>;
        download: (request_id: string, options: { file_type: string }, callback: (err: Error, response: ReadableStream) => void) => void;
        cancel: (request_id: string) => Promise<SignatureRequestResponse>;
      }
    }

    export namespace Embedded {
      export interface Data {
        sign_url: string;
        expires_at: number;
      }
      export type Response = BasicResponse & {
        embedded: Data;
      };
      interface Api {
        getSignUrl: (signatureId: string) => Promise<Response>;
        getEditUrl: (templateId: string) => Promise<Response>;
      }
    }

    // Api
    export interface Api {
      account: Account.Api;
      signatureRequest: SignatureRequest.Api;
      embedded: Embedded.Api;
    }

    // Http callbacks
    export namespace Callback {
      export type EventSignature =
        | 'signature_request_viewed'
        | 'signature_request_downloadable'
        | 'signature_request_sent'
        | 'signature_request_declined'
        | 'signature_request_reassigned'
        | 'signature_request_remind'
        | 'signature_request_all_signed'
        | 'signature_request_email_bounce'
        | 'signature_request_invalid'
        | 'signature_request_canceled'
        | 'signature_request_prepared'
        | 'signature_request_declined'
        | 'signature_request_signed';

      export type EventTest = 'callback_test';

      export type EventSignUrlInvalid = 'sign_url_invalid';

      export type EventTemplate = 'template_created' | 'template_error';

      interface Event<T extends string> {
        event_time: string;
        event_hash: string;
        event_type: T;
      }

      interface Base<T extends string> {
        event: Event<T>;
      }

      export type Signature = Base<EventSignature> & {
        signature_request: SignatureRequest.SignatureRequest;
      };

      export type Test = Base<EventTest>;

      export type SignUrlInvalid = Base<EventSignUrlInvalid>;

      export type Template = Base<EventTemplate>;

      export type Data = Signature | Test | SignUrlInvalid | Template;
    }
  }
  export = Hellosign;
}
