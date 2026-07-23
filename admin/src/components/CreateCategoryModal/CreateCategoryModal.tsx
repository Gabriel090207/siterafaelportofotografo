import "./CreateCategoryModal.css";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    X,
    Upload,
    ImagePlus,
    Loader2,
} from "lucide-react";


interface CreateCategoryModalProps {

    open: boolean;

    onClose: () => void;

    category?: {
        id?: string;
        name: string;
        cover: string;
    } | null;

    onCreate: (
        data: {
            name: string;
            file: File;
        }
    ) => Promise<void>;

    onUpdate: (
        data: {
            id: string;
            name: string;
            file: File | null;
        }
    ) => Promise<void>;

}

const CreateCategoryModal = ({
    open,
    onClose,
    category,
    onCreate,
    onUpdate,
}: CreateCategoryModalProps) => {


    const [name, setName] =
        useState("");


    const [file, setFile] =
        useState<File | null>(null);


    const [preview, setPreview] =
        useState<string>("");


    const [closing, setClosing] =
        useState(false);


    const [saving, setSaving] =
        useState(false);



    const closeTimer =
        useRef<number | null>(null);


    const inputRef =
        useRef<HTMLInputElement>(null);



   useEffect(() => {

    if (!open)
        return;

    setClosing(false);

    if (category) {

        setName(category.name);

        setPreview(category.cover);

        setFile(null);

    } else {

        setName("");

        setPreview("");

        setFile(null);

    }

}, [open, category]);



    useEffect(() => {

        return () => {

            if (closeTimer.current) {

                clearTimeout(
                    closeTimer.current
                );

            }

        };

    }, []);




    const handleClose = () => {

        if (saving) return;


        setClosing(true);


        closeTimer.current =
            window.setTimeout(() => {

                onClose();

            },350);

    };




    const handleFile = (
        event:
        React.ChangeEvent<HTMLInputElement>
    ) => {

        const selected =
            event.target.files?.[0];


        if (!selected)
            return;



        setFile(selected);



        setPreview(
            URL.createObjectURL(
                selected
            )
        );

    };




    const handleSave = async () => {

    if (!name)
        return;

    try {

        setSaving(true);

        if (category) {

            await onUpdate({

                id: category.id!,

                name,

                file,

            });

        } else {

            if (!file)
                return;

            await onCreate({

                name,

                file,

            });

        }

        setName("");

        setFile(null);

        setPreview("");

    } catch (error) {

        console.error(error);

    } finally {

        setSaving(false);

    }

};




    if (!open && !closing)
        return null;



    return (

        <div
            className={
                closing
                ? "category-modal category-modal--closing"
                : "category-modal"
            }
        >


            <div
                className="category-modal__backdrop"
                onClick={handleClose}
            />



            <div className="category-modal__card">


                <button

                    className="category-modal__close"

                    onClick={handleClose}

                    disabled={saving}

                >

                    <X size={20}/>

                </button>



                <div className="category-modal__icon">

                    <ImagePlus size={34}/>

                </div>



                <h2 className="category-modal__title">

    {category
        ? "Editar Categoria"
        : "Nova Categoria"}

</h2>


                <p className="category-modal__message">

    {category
    ? "Altere as informações da categoria de evento."
    : "Crie uma categoria para organizar os eventos do site."}
</p>



                <div className="category-modal__form">


                    <div className="category-modal__field">

                        <label>

                            Nome da categoria

                        </label>


                        <input

                            value={name}

                            disabled={saving}

                            onChange={(event)=>
                                setName(
                                    event.target.value
                                )
                            }

                            placeholder="Ex: Casamentos"

                        />

                    </div>




                    <div className="category-modal__field">

                        <label>

                            Capa

                        </label>


                        <input

                            ref={inputRef}

                            type="file"

                            accept="image/*"

                            hidden

                            onChange={handleFile}

                        />



                        {!preview ? (

                            <button

                                className="category-modal__upload"

                                type="button"

                                onClick={() =>
                                    inputRef.current?.click()
                                }

                            >

                                <Upload size={22}/>

                                <span>

                                    Escolher imagem

                                </span>


                            </button>


                        ) : (


                            <div className="category-modal__preview">


                                <img

                                    src={preview}

                                    alt="Preview"

                                />


                                <button

                                    type="button"

                                    onClick={() =>
                                        inputRef.current?.click()
                                    }

                                >

                                    Alterar imagem

                                </button>


                            </div>


                        )}


                    </div>


                </div>




                <div className="category-modal__actions">


                    <button

                        className="category-modal__cancel"

                        onClick={handleClose}

                        disabled={saving}

                    >

                        Cancelar

                    </button>




                   <button

    className="category-modal__confirm"

    disabled={
        saving ||
        !name ||
        (!category && !file)
    }

    onClick={handleSave}

>

                       {saving ? (

    <>

        <Loader2
            size={18}
            className="category-modal__loader"
        />

        {category
            ? "Salvando..."
            : "Criando..."}

    </>

) : (

    category
        ? "Salvar Alterações"
        : "Salvar Categoria"

)}

                    </button>



                </div>



            </div>


        </div>

    );

};


export default CreateCategoryModal;