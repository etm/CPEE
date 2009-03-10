require 'MyHandler'


module MyHandlerFactory 
  def create_handler
    return MyHandler.new
  end
end