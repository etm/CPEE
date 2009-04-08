require 'MyHandler'


module MyHandlerFactory 
  def create_handler
    MyHandler.new
  end
end