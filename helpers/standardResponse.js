var response = {
  success: true, //true , false
  data: [],
  meta: {
    https_code: 200,
    page: 1,
  },
  message: "",
  error: false,
  errors: [],
};

const resetter = () => {
  response = {
    success: true,
    error: false,
    data: [],
    meta: {
      https_code: 200,
      page: 1,
    },
    error: false,
    message: "",

    errors: [],
  };
};
const responseSetter = ({
  result,
  data = [],
  httpstate,
  errors,
  message,
  page,
  metaObj,
}) => {
  resetter();
  const res = response;
  if (result == true) {
    //create good resp
    res.success = true;
    res.data = data;
    res.meta.https_code = httpstate;
    !metaObj ? (res.meta.page = page) : (res.meta = metaObj);
    res.error = !result;
    res.errors = [];
    res.message = message;
  }
  //create bad req
  else {
    res.success = false;
    res.data = [];
    res.meta.https_code = httpstate;
    res.message = message;
    res.error = !result;
    // if (Array.isArray(errors)) res.errors = errors;
    // else res.errors = [errors];
    res.errors = errors;
  }
  return res;
};

const metaSetter = (page, myTotalSize, onePageItems) => {
  const totalSize = myTotalSize;
  const totalPages = Math.ceil(totalSize / 10);
  const prevPage = page - 1 > 0 ? page - 1 : null;
  const nextPage = page + 1 > totalPages ? null : page + 1; //totalPages - page > 0 ? totalPages - page : null;
  const pageItemsSize = onePageItems;

  var metaResp = {
    total_items: totalSize,
    total_pages: totalPages,
    current_page: page,
    page_items: pageItemsSize,
    next_page: nextPage,
    prev_page: prevPage,
    http_code: 200,
  };
  return metaResp;
};

const multiLingMessages = {
  buyReq: {
    title: {
      en: "Your request has been viewed",
      ar: "تم الاطلاع على طلبك",
    },
    body: {
      en: "A service provider has viewed your request",
      ar: "قام أحد مقدمي الخدمة بالاطلاع على طلبك",
    },
  },
  offerReq: {
    title: {
      en: "Offer Recieved",
      ar: "تم استلام عرض",
    },
    body: {
      en: "A service provider has sent you an offer. Check it out now",
      ar: "لقد قام أحد مقدمي الخدمة بإرسال عرض لك. اطلع عليه الآن",
    },
  },
  alreadyOfferExist: {
    offer: {
      msg_en: "Offer is not sent successfully as it had been sent already",
      msg_ar: "لم يتم إرسال العرض بنجاح",
    },
  },
  login3d: {
    db: {
      msg_en: "Email does not exist. Please create an account first",
      msg_ar: "، ، لم يتم ايجاد البريد الإلكتروني، يرجى إنشاء حساب أولًا",
    },
  },
  logoutneeded: {
    server: {
      msg_en: "md: You have been logout because you are not authorized",
      msg_ar: "تم تسجيل خروجك لأنك غير مصرح لك استخدام النظام",
    },
  },
  noAuth: {
    server: {
      msg_en: "md: request need authorization to be procceed no valid auth",
      msg_ar: "الطلب يحتاج إلى إذن لكي يتم إجراء أي مصادقة",
    },
  },
  noPrivilage: {
    server: {
      msg_en: "md: out of privilege for the requested user",
      msg_ar: "خارج الصلاحيه للمستخدم المطلوب",
    },
  },
  dbError: {
    db: {
      msg_en: "error in proceeding",
      msg_ar: " حدث خطأ أثناء تنفيذ العملية",
    },
  },
  emailExist: {
    email: {
      msg_en: "please check your credentials and try again",
      msg_ar: "يرجى التحقق من بيانات الاعتماد الخاصة بك والمحاولة مرة أخرى",
    },
  },
  signUpError: {
    db: {
      //id: 1,
      msg_en: "error while signing up",
      msg_ar: "خطأ أثناء التسجيل",
    },
  },
  otpDb: {
    db: {
      msg_en: "otp was not added successfully to database",
      msg_ar: "لم يتم إضافة الرمز بنجاح إلى قاعدة البيانات",
    },
  },
  otpSendEmail: {
    userotp: {
      msg_en: "otp wasn't sent to email address successfully",
      msg_ar: "لم يتم إرسال الرمز إلى البريد الإلكتروني بنجاح",
    },
  },

  missingPayload: {
    fields: {
      msg_en: "Missing data",
      msg_ar: "البيانات المدخلة غير كافية",
    },
  },
  otpCheck: {
    userotp: {
      //   id: 5,
      msg_en: "The OTP is not correct",
      msg_ar: "كلمة المرور لمرة واحدة غير صحيحة",
    },
  },
  verifyUserDb: {
    // id: 6,
    db: {
      msg_en: "verify user error while adding to DB",
      msg_ar: "خطأ أثناء التحقق من المستخدم عند الإضافة إلى قاعدة البيانات",
    },
  },
  loginEmailNotFound: {
    email: {
      msg_en: "please check your credentials and try again",
      msg_ar: "يرجى التحقق من بيانات الاعتماد الخاصة بك والمحاولة مرة أخرى",
    },
  },
  loginEmailNotVerfied: {
    email: {
      msg_en: "email exist but has not been verified yet. An OTP has been sent",
      msg_ar:
        "البريد الإلكتروني موجود ولكنه غير موثق، تم إرسال كلمة مرور لمرة واحدة",
    },
  },
  loginPassWrong: {
    password: {
      msg_en: "please check your credentials and try again",
      msg_ar: "يرجى التحقق من بيانات الاعتماد الخاصة بك والمحاولة مرة أخرى",
    },
  },
  authHandlerError: {
    db: {
      msg_en: "adding or updating auth table error",
      msg_ar: "خطأ في إدخال البيانات",
    },
  },
  BlockedError: {
    auth: {
      msg_en: "User is already blocked",
      msg_ar: "تم حجب المستخدم",
    },
  },
  formEmail: {
    // id: 11,
    // field: "email_field",
    email_field: {
      msg_en: "email is required and must be valid",
      msg_ar: " البريد الإلكتروني مطلوب ويجب أن يكون فعالا ",
    },
  },
  formPass: {
    // id: 12,
    // field: "password_field",
    password_field: {
      msg_en: "Password is required and must be more than 6 chars",
      msg_ar: " كلمة المرور مطلوبة ويجب أن تحتوي على أكثر من 6 خانات ",
    },
  },
  fullname_fieldError: {
    emailfield: {
      // id: 13,
      msg_en: "full name field is required",
      msg_ar: "حقل الإسم الرباعي مطلوب",
    },
  },
  alreadyActiveLoan: {
    db: {
      msg_en:
        "You can't apply for a new loan now as you already have an active request",
      msg_ar:
        "لا يمكنك التقدم بطلب قرض جديد الآن لأن لديك طلب قرض ساري المفعول  ",
    },
  },
  nameEnError: {
    fullname_en: {
      msg_en: "full name en is missing",
      msg_ar: "لم يتم إدخال الإسم الرباعي باللغة الإنجليزية",
    },
  },
  nameArError: {
    fullname_ar: {
      // id: 13,
      msg_en: "full name ar is missing",
      msg_ar: "لم يتم إدخال الإسم الرباعي باللغة العربية",
    },
  },
  civilIdError: {
    civil_id: {
      msg_en: "Civil ID field is missing",
      msg_ar: "لم يتم إدخال الرقم المدني  ",
    },
  },
  civilIdInvalidError: {
    civil_id: {
      msg_en: "Civil id field  is invalid",
      msg_ar: "الرقم المدني غير صحيح",
    },
  },
  nationalityError: {
    nationality: {
      // id: 13,
      msg_en: "nationality  field  is missing",
      msg_ar: "لم يتم تعبئة حقل الجنسية",
    },
  },
  countryError: {
    country: {
      // id: 13,
      msg_en: "country field  is missing",
      msg_ar: "لم يتم تعبئة حقل البلد",
    },
  },
  cityError: {
    city: {
      // id: 13,
      msg_en: "city field  is missing",
      msg_ar: "لم يتم تعبئة حقل المدينة",
    },
  },
  currencyError: {
    currency: {
      // id: 13,
      msg_en: "currency field  is missing",
      msg_ar: "لم يتم تعبئة حقل العملة",
    },
  },
  phone_numberError: {
    phone_number: {
      // id: 13,
      msg_en: "phone_number field  is missing",
      msg_ar: "لم يتم تعبئة رقم الهاتف",
    },
  },
  phone_numberInvalidError: {
    phone_number: {
      // id: 13,
      msg_en: "contact field  is invalid",
      msg_ar: "رقم الهاتف غير صحيح",
    },
  },
  genderError: {
    gender: {
      msg_en: "gender field  is missing",
      msg_ar: "لم يتم تحديد الجنس",
    },
  },
  birth_dateError: {
    birth_date: {
      msg_en: "birth_date field  is missing",
      msg_ar: "لم يتم إدخال تاريخ الميلاد",
    },
  },
  employerError: {
    employer: {
      msg_en: "employer field  is missing",
      msg_ar: " لم يتم نعبئة حقل جهة العمل",
    },
  },
  employment_statusError: {
    employment_status: {
      msg_en: "employment_status field  is missing",
      msg_ar: "لم يتم تعبئة حقل حالة الوظيفة",
    },
  },
  incomeError: {
    income: {
      msg_en: "income field  is missing",
      msg_ar: "لم يتم تعبئة قيمة الدخل الشهري",
    },
  },
  salaryError: {
    income: {
      msg_en: "salary field  is missing",
      msg_ar: "لم يتم تعبئة قيمة الدخل الشهري",
    },
  },
  preferred_organization_typeError: {
    preferred_organization_type: {
      msg_en: "preferred_organization_type field  is missing",
      msg_ar: "لم يتم تحديد نوع المؤسسة ",
    },
  },
  preferred_business_typeError: {
    preferred_business_type: {
      msg_en: "preferred_business_type field  is missing",
      msg_ar: "لم يتم تحديد نوع المُقرض",
    },
  },
  typeError: {
    type: {
      msg_en: "type field  is missing",
      msg_ar: "لم يتم تحديد نوع القرض",
    },
  },
  amountError: {
    amount: {
      msg_en: "amount field  is missing",
      msg_ar: "لم يتم تحديد قيمة القرض",
    },
  },
  installments_numberError: {
    installments_number: {
      msg_en: "installments_number field  is missing",
      msg_ar: "لم يتم تحديد عدد الأقساط",
    },
  },
  stepError: {
    step: {
      msg_en: "step is not provided",
      msg_ar: "لم يتم تحديد المرحلة",
    },
  },
};

// gender: ["male", "female"],
//   employment_status: [
//     "employed",
//     "unemployed",
//     "retired",
//     "student",
//     "business_owner",
//   ],
//   income: [
//     [100, 500],
//     [500, 1000],
//     [1000, 4000],
//   ],
//   salary: [
//     [100, 500],
//     [500, 1000],
//     [1000, 4000],
//   ],
//   nationality: ["any"],
//   city: [1, 2],
//   request_time: ["any", "any"],
//   offer_time: ["any", "any"],
//   offer_action_time: ["any", "any"],
//   service_type: ["car_leasing", "loanz"],
//   offer_status: ["pending", "accepted", "rejected", "completed", "incompleted"],
//   private_status: ["no_response", "respond", "granted", "default"],
const mulitLangFilters = {
  gender: { en: "Gender", ar: "الجنس" },
  male: { en: "male", ar: "ذكر" },
  female: { en: "female", ar: "أنثى" },
  employment_status: { en: "employment status", ar: "الحالة الوظيفية" },
  employed: { en: "employed", ar: "موظف" },
  unemployed: { en: "unemployed", ar: "غير موظف" },
  retired: { en: "retired", ar: "متقاعد" },
  student: { en: "student", ar: "طالب" },
  business_owner: { en: "business owner", ar: "صاحب عمل" },
  income: { en: "income", ar: "مصادر دخل أخرى" },
  salary: { en: "salary", ar: "الراتب الأساسي" },
  nationality: { en: "nationality", ar: "الجنسية" },
  city: { en: "city", ar: "المحافظة" },
  request_time: { en: "request time", ar: "تاريخ الطلب" },
  offer_time: { en: "offer time", ar: "تاريخ العرض" },
  offer_action_time: { en: "offer action time", ar: "تاريخ اتخاذ الآجراء" },
  service_type: { en: "service type", ar: "نوع الخدمة" },
  car_leasing: { en: "car leasing", ar: "تأجير السيارات" },
  loan: { en: "loan", ar: "قرض" },
  offer_status: { en: "offer status", ar: "حالة العرض" },
  pending: { en: "pending", ar: "معلق" },
  accepted: { en: "accepted", ar: "مقبول" },
  rejected: { en: "rejected", ar: "مرفوض" },
  completed: { en: "completed", ar: "مكتمل" },
  incompleted: { en: "incompleted", ar: "غير مكتمل" },
  private_status: { en: "private status", ar: "الوضع الخاص" },
  no_response: { en: "no response", ar: "لا يوجد رد" },
  respond: { en: "respond", ar: "رد" },
  granted: { en: "granted", ar: "تم المنح" },
  default: { en: "default", ar: "لم تُحدد" },
};

// {
//   buyReq: {
//     title: {
//       en: "a lender has viewed your request",
//       ar: "المقرض قد اطلع على طلبك",
//     },
//     body: {
//       en: "a lender has viewed your request stay tuned",
//       ar: "المقرض قد اطلع على طلبك",
//     },
//   },
//   offerReq: {
//     title: {
//       en: "a lender has just send you an offer",
//       ar: "لقد أرسل لك أحد المقرضين عرضًا للتو",
//     },
//     body: {
//       en: "a lender has just send you an offer check out now",
//       ar: "لقد أرسل لك أحد المقرضين عرضًا للتو",
//     },
//   },
//   alreadyOfferExist: {
//     offer: {
//       msg_en: "Offer is not sent successfully",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   login3d: {
//     db: {
//       msg_en: "Email is not exist please sign up first",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   logoutneeded: {
//     server: {
//       msg_en: "md: user already logged in from another device , logout needed",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   noAuth: {
//     server: {
//       msg_en: "md: request need authorization to be procceed no valid auth",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   noPrivilage: {
//     server: {
//       msg_en: "md: out of privilege for the requested user",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   dbError: {
//     db: {
//       msg_en: "input value isn't valid",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   emailExist: {
//     email: {
//       //  id: 0,
//       msg_en: "email is already exist , not valid signup",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   signUpError: {
//     db: {
//       //id: 1,
//       msg_en: "error while signing up",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   otpDb: {
//     db: {
//       msg_en: "otp was not added successfully to database",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   otpSendEmail: {
//     userotp: {
//       msg_en: "otp wasn't sent to email address successfully",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },

//   missingPayload: {
//     fields: {
//       msg_en: "missing payload data",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   otpCheck: {
//     userotp: {
//       //   id: 5,
//       msg_en: "otp is not correct",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   verifyUserDb: {
//     // id: 6,
//     db: {
//       msg_en: "verify user error while adding to DB",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   loginEmailNotFound: {
//     email: {
//       msg_en: "email not found in the system",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   loginEmailNotVerfied: {
//     email: {
//       msg_en: "email exist but not verified , otp has been sent ",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   loginPassWrong: {
//     password: {
//       msg_en: "password provided is not correct",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   authHandlerError: {
//     // id: 10,
//     db: {
//       msg_en: "adding or updating auth table error",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   formEmail: {
//     // id: 11,
//     // field: "email_field",
//     email_field: {
//       msg_en: "email is required and must be valid",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   formPass: {
//     // id: 12,
//     // field: "password_field",
//     password_field: {
//       msg_en: "Password is required and must be more than 6 chars",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   fullname_fieldError: {
//     emailfield: {
//       // id: 13,
//       msg_en: "full name field is required",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   alreadyActiveLoan: {
//     db: {
//       msg_en:
//         "User has already Active Loan , can't make new one at the same time",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   nameEnError: {
//     fullname_en: {
//       msg_en: "full name en is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   nameArError: {
//     fullname_ar: {
//       // id: 13,
//       msg_en: "full name ar is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   civilIdError: {
//     civil_id: {
//       msg_en: "Civil id field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   civilIdInvalidError: {
//     civil_id: {
//       msg_en: "Civil id field  is invalid",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   nationalityError: {
//     nationality: {
//       // id: 13,
//       msg_en: "nationality  field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   countryError: {
//     country: {
//       // id: 13,
//       msg_en: "country field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   cityError: {
//     city: {
//       // id: 13,
//       msg_en: "city field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   currencyError: {
//     currency: {
//       // id: 13,
//       msg_en: "currency field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   phone_numberError: {
//     phone_number: {
//       // id: 13,
//       msg_en: "phone_number field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   phone_numberInvalidError: {
//     phone_number: {
//       // id: 13,
//       msg_en: "phone_number field  is invalid",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   genderError: {
//     gender: {
//       msg_en: "gender field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   birth_dateError: {
//     birth_date: {
//       msg_en: "birth_date field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   employerError: {
//     employer: {
//       msg_en: "employer field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   employment_statusError: {
//     employment_status: {
//       msg_en: "employment_status field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   incomeError: {
//     income: {
//       msg_en: "income field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   preferred_organization_typeError: {
//     preferred_organization_type: {
//       msg_en: "preferred_organization_type field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   preferred_business_typeError: {
//     preferred_business_type: {
//       msg_en: "preferred_business_type field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   typeError: {
//     type: {
//       msg_en: "type field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   amountError: {
//     amount: {
//       msg_en: "amount field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   installments_numberError: {
//     installments_number: {
//       msg_en: "installments_number field  is missing",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
//   stepError: {
//     step: {
//       msg_en: "step is not provided",
//       msg_ar: "لم يتم ايجاد البريد الالكتروني",
//     },
//   },
// };

const allEnums = {
  auth_status: ["active", "blocked"],
  bank_type: ["commercial", "islamic"],
  gender: ["male", "female"],
  employment_status: ["employed", "unemployed", "retired"],
  currency: ["USD", "KWD", "JOD"],
  offer_statuses: [
    "pending",
    "accepted",
    "rejected",
    "completed",
    "incompleted",
  ],
  loan_type: ["auto", "housing", "personal", "other"],
  organization_type: ["any", "banks", "financial_companies"],
  business_type: ["any", "commercial", "islamic"],
  loan_type: ["auto", "housing", "personal", "other"],
  notification_type: ["generic", "specific", "offer", "buy_request"],
  user_type: ["customer", "bank", "admin", "bank_employee"],
  login_method: ["classic", "google", "facebook", "apple", "twitter"],
};

module.exports = {
  response,
  multiLingMessages,
  responseSetter,
  metaSetter,
  allEnums,
  mulitLangFilters,
};
