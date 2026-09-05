

function Button({title,type,isLoading,loadingTitle}:{title:string,type:"submit"|"reset"|"button",isLoading:boolean,loadingTitle?:string}) {
  return (
    <button
            type={type}
            disabled={isLoading}
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition duration-200 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {!isLoading?title:(loadingTitle || "Please wait..")}
    </button>
  )
}

export default Button